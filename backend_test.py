#!/usr/bin/env python3

import requests
import sys
import json
import uuid
from datetime import datetime
import os
from pathlib import Path

class RevBoxAPITester:
    def __init__(self, base_url="https://insurance-crm-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_resources = {
            'carriers': [],
            'uploads': [],
            'agents': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if files:
                # Remove Content-Type for file uploads
                headers.pop('Content-Type', None)
                
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self):
        """Test login with test credentials"""
        success, response = self.run_test(
            "Login",
            "POST",
            "auth/login",
            200,
            data={"email": "test@example.com", "password": "test123"}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_dashboard(self):
        """Test dashboard endpoint"""
        success, response = self.run_test(
            "Dashboard",
            "GET",
            "dashboard",
            200
        )
        if success:
            print(f"   Dashboard stats: {response.get('total_carriers', 0)} carriers, {response.get('total_uploads', 0)} uploads")
        return success

    def test_create_carrier(self):
        """Test creating a data source (carrier)"""
        carrier_data = {
            "name": f"Test Carrier {datetime.now().strftime('%H%M%S')}",
            "code": f"TEST{datetime.now().strftime('%H%M%S')}",
            "description": "Test carrier for API testing",
            "primary_key_fields": ["policy_number", "agent_code"],
            "field_mappings": {
                "Policy Number": "policy_number",
                "Agent Code": "agent_code",
                "Agent Name": "agent_name",
                "Premium": "amount",
                "State": "state"
            },
            "header_row": 1,
            "data_start_row": 2,
            "file_type": "excel"
        }
        
        success, response = self.run_test(
            "Create Carrier/Data Source",
            "POST",
            "carriers",
            200,
            data=carrier_data
        )
        if success and 'id' in response:
            self.created_resources['carriers'].append(response['id'])
            print(f"   Created carrier ID: {response['id']}")
        return success, response

    def test_get_carriers(self):
        """Test getting all carriers"""
        success, response = self.run_test(
            "Get Carriers",
            "GET",
            "carriers",
            200
        )
        if success:
            print(f"   Found {len(response)} carriers")
        return success, response

    def test_upload_file(self, carrier_id):
        """Test file upload to a carrier"""
        # Create a simple test CSV file
        test_csv_content = """Policy Number,Agent Code,Agent Name,Premium,State
POL001,AG001,John Smith,1500.00,CA
POL002,AG002,Jane Doe,2000.00,NY
POL003,AG001,John Smith,1800.00,TX"""
        
        # Write to temp file
        temp_file = Path("/tmp/test_upload.csv")
        temp_file.write_text(test_csv_content)
        
        try:
            with open(temp_file, 'rb') as f:
                files = {'file': ('test_upload.csv', f, 'text/csv')}
                data = {'carrier_id': carrier_id}
                
                success, response = self.run_test(
                    "Upload File",
                    "POST",
                    "uploads",
                    200,
                    data=data,
                    files=files
                )
                
            if success and 'id' in response:
                self.created_resources['uploads'].append(response['id'])
                print(f"   Upload ID: {response['id']}, Records: {response.get('total_records', 0)}")
                return success, response
        finally:
            if temp_file.exists():
                temp_file.unlink()
        
        return False, {}

    def test_get_uploads(self):
        """Test getting all uploads"""
        success, response = self.run_test(
            "Get Uploads",
            "GET",
            "uploads",
            200
        )
        if success:
            print(f"   Found {len(response)} uploads")
        return success, response

    def test_get_upload_records(self, upload_id):
        """Test getting records for an upload"""
        success, response = self.run_test(
            "Get Upload Records",
            "GET",
            f"uploads/{upload_id}/records",
            200
        )
        if success:
            print(f"   Found {len(response)} records for upload")
        return success, response

    def test_delete_upload(self, upload_id):
        """Test DELETE upload functionality (newly implemented)"""
        success, response = self.run_test(
            "Delete Upload (NEW FEATURE)",
            "DELETE",
            f"uploads/{upload_id}",
            200
        )
        if success:
            print(f"   Upload deleted successfully: {response.get('message', '')}")
            # Remove from our tracking
            if upload_id in self.created_resources['uploads']:
                self.created_resources['uploads'].remove(upload_id)
        return success

    def test_get_conflicts(self):
        """Test getting conflicts"""
        success, response = self.run_test(
            "Get Conflicts",
            "GET",
            "conflicts",
            200
        )
        if success:
            print(f"   Found {len(response)} conflicts")
        return success, response

    def test_conflict_details(self, conflict_id):
        """Test getting conflict details (newly implemented)"""
        success, response = self.run_test(
            "Get Conflict Details (NEW FEATURE)",
            "GET",
            f"conflicts/{conflict_id}/details",
            200
        )
        if success:
            print(f"   Conflict details retrieved with reason: {response.get('reason', 'N/A')[:50]}...")
        return success, response

    def test_export_approved_data(self):
        """Test export approved data (newly implemented)"""
        formats = ['csv', 'json', 'zoho']
        
        for format_type in formats:
            success, response = self.run_test(
                f"Export Approved Data - {format_type.upper()} (NEW FEATURE)",
                "GET",
                f"export/approved?format={format_type}",
                200
            )
            if success:
                count = response.get('count', 0)
                print(f"   {format_type.upper()} export: {count} records")
        
        return True

    def test_get_records(self):
        """Test getting records"""
        success, response = self.run_test(
            "Get Records",
            "GET",
            "records",
            200
        )
        if success:
            print(f"   Found {len(response)} records")
        return success, response

    def cleanup_resources(self):
        """Clean up created test resources"""
        print(f"\n🧹 Cleaning up test resources...")
        
        # Delete uploads
        for upload_id in self.created_resources['uploads'][:]:
            self.test_delete_upload(upload_id)
        
        # Delete carriers
        for carrier_id in self.created_resources['carriers']:
            success, _ = self.run_test(
                "Cleanup Carrier",
                "DELETE",
                f"carriers/{carrier_id}",
                200
            )
            if success:
                print(f"   Cleaned up carrier: {carrier_id}")

def main():
    print("🚀 Starting Rev-Box API Testing...")
    tester = RevBoxAPITester()
    
    try:
        # Test authentication
        if not tester.test_login():
            print("❌ Login failed, stopping tests")
            return 1

        # Test dashboard
        tester.test_dashboard()

        # Test carriers (data sources)
        success, carrier = tester.test_create_carrier()
        if not success:
            print("❌ Carrier creation failed")
            return 1
        
        carrier_id = carrier.get('id')
        tester.test_get_carriers()

        # Test file upload
        success, upload = tester.test_upload_file(carrier_id)
        if not success:
            print("❌ File upload failed")
            return 1
        
        upload_id = upload.get('id')
        
        # Test upload-related endpoints
        tester.test_get_uploads()
        records_success, records = tester.test_get_upload_records(upload_id)
        
        # Test NEW FEATURE: Delete upload
        tester.test_delete_upload(upload_id)

        # Test conflicts
        conflicts_success, conflicts = tester.test_get_conflicts()
        if conflicts_success and conflicts:
            # Test NEW FEATURE: Conflict details
            tester.test_conflict_details(conflicts[0]['id'])

        # Test records
        tester.test_get_records()

        # Test NEW FEATURE: Export functionality
        tester.test_export_approved_data()

        # Print results
        print(f"\n📊 Test Results:")
        print(f"   Tests passed: {tester.tests_passed}/{tester.tests_run}")
        print(f"   Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
        
        return 0 if tester.tests_passed == tester.tests_run else 1

    except Exception as e:
        print(f"❌ Test suite error: {e}")
        return 1
    finally:
        # Cleanup
        tester.cleanup_resources()

if __name__ == "__main__":
    sys.exit(main())
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_auth_flow(self):
        """Test user registration and login"""
        print("\n🔐 Testing Authentication...")
        
        # Generate unique test user
        test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        test_password = "TestPass123!"
        test_name = "Test User"

        # Test registration
        register_data = {
            "email": test_email,
            "password": test_password,
            "name": test_name
        }
        
        result = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=register_data
        )
        
        if result and 'access_token' in result:
            self.token = result['access_token']
            self.user_id = result['user']['id']
            
            # Test login with same credentials
            login_data = {
                "email": test_email,
                "password": test_password
            }
            
            login_result = self.run_test(
                "User Login",
                "POST",
                "auth/login",
                200,
                data=login_data
            )
            
            if login_result and 'access_token' in login_result:
                self.token = login_result['access_token']
                
                # Test get current user
                self.run_test(
                    "Get Current User",
                    "GET",
                    "auth/me",
                    200
                )
                
                return True
        
        return False

    def test_carriers_crud(self):
        """Test carrier CRUD operations"""
        print("\n🏢 Testing Carriers...")
        
        # Create carrier
        carrier_data = {
            "name": "Test Insurance Co",
            "code": "TESTINS",
            "description": "Test insurance carrier",
            "primary_key_fields": ["policy_number", "agent_code"],
            "field_mappings": {
                "Policy Number": "policy_number",
                "Agent Code": "agent_code",
                "Premium": "amount"
            }
        }
        
        carrier = self.run_test(
            "Create Carrier",
            "POST",
            "carriers",
            200,
            data=carrier_data
        )
        
        if not carrier:
            return False
            
        carrier_id = carrier['id']
        
        # Get all carriers
        self.run_test(
            "Get All Carriers",
            "GET",
            "carriers",
            200
        )
        
        # Get specific carrier
        self.run_test(
            "Get Carrier by ID",
            "GET",
            f"carriers/{carrier_id}",
            200
        )
        
        # Update carrier
        update_data = {
            "name": "Updated Test Insurance Co",
            "code": "TESTINS",
            "description": "Updated description",
            "primary_key_fields": ["policy_number"],
            "field_mappings": {"Policy Number": "policy_number"}
        }
        
        self.run_test(
            "Update Carrier",
            "PUT",
            f"carriers/{carrier_id}",
            200,
            data=update_data
        )
        
        # Update field mappings
        mapping_data = {
            "field_mappings": {
                "Policy Number": "policy_number",
                "Agent ID": "agent_code",
                "Amount": "amount"
            },
            "primary_key_fields": ["policy_number", "agent_code"]
        }
        
        self.run_test(
            "Update Field Mappings",
            "PUT",
            f"carriers/{carrier_id}/field-mappings",
            200,
            data=mapping_data
        )
        
        # Delete carrier (save for last)
        self.run_test(
            "Delete Carrier",
            "DELETE",
            f"carriers/{carrier_id}",
            200
        )
        
        return True

    def test_agents_crud(self):
        """Test agent CRUD operations"""
        print("\n👥 Testing Agents...")
        
        # Create agent
        agent_data = {
            "name": "John Test Agent",
            "agent_code": "AGT001",
            "email": "agent@test.com",
            "phone": "(555) 123-4567",
            "address": "123 Test St, Test City, TS 12345",
            "commission_rate": 5.5
        }
        
        agent = self.run_test(
            "Create Agent",
            "POST",
            "agents",
            200,
            data=agent_data
        )
        
        if not agent:
            return False
            
        agent_id = agent['id']
        
        # Get all agents
        self.run_test(
            "Get All Agents",
            "GET",
            "agents",
            200
        )
        
        # Get specific agent
        self.run_test(
            "Get Agent by ID",
            "GET",
            f"agents/{agent_id}",
            200
        )
        
        # Update agent
        update_data = {
            "name": "John Updated Agent",
            "agent_code": "AGT001",
            "email": "updated@test.com",
            "phone": "(555) 987-6543",
            "address": "456 Updated St, Test City, TS 12345",
            "commission_rate": 6.0
        }
        
        self.run_test(
            "Update Agent",
            "PUT",
            f"agents/{agent_id}",
            200,
            data=update_data
        )
        
        # Delete agent
        self.run_test(
            "Delete Agent",
            "DELETE",
            f"agents/{agent_id}",
            200
        )
        
        return True

    def test_dashboard(self):
        """Test dashboard endpoint"""
        print("\n📊 Testing Dashboard...")
        
        self.run_test(
            "Get Dashboard Stats",
            "GET",
            "dashboard",
            200
        )
        
        return True

    def test_upload_endpoints(self):
        """Test upload-related endpoints"""
        print("\n📤 Testing Upload Endpoints...")
        
        # Get uploads (should be empty initially)
        self.run_test(
            "Get All Uploads",
            "GET",
            "uploads",
            200
        )
        
        return True

    def test_records_endpoints(self):
        """Test records and conflicts endpoints"""
        print("\n📋 Testing Records & Conflicts...")
        
        # Get records
        self.run_test(
            "Get All Records",
            "GET",
            "records",
            200
        )
        
        # Get conflicts
        self.run_test(
            "Get All Conflicts",
            "GET",
            "conflicts",
            200
        )
        
        return True

    def test_payouts_endpoints(self):
        """Test payout endpoints"""
        print("\n💰 Testing Payouts...")
        
        # Get payouts
        self.run_test(
            "Get All Payouts",
            "GET",
            "payouts",
            200
        )
        
        return True

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Insurance CRM API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Test authentication first
        if not self.test_auth_flow():
            print("❌ Authentication failed - stopping tests")
            return False
        
        # Run all other tests
        test_suites = [
            self.test_dashboard,
            self.test_carriers_crud,
            self.test_agents_crud,
            self.test_upload_endpoints,
            self.test_records_endpoints,
            self.test_payouts_endpoints
        ]
        
        for test_suite in test_suites:
            try:
                test_suite()
            except Exception as e:
                print(f"❌ Test suite failed: {e}")
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = InsuranceCRMTester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results = {
        "timestamp": datetime.now().isoformat(),
        "total_tests": tester.tests_run,
        "passed_tests": tester.tests_passed,
        "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0,
        "test_details": tester.test_results
    }
    
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())