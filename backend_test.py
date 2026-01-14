#!/usr/bin/env python3

import requests
import sys
import json
import uuid
from datetime import datetime
import os

class InsuranceCRMTester:
    def __init__(self, base_url="https://insurance-crm-hub.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        if files:
            # Remove Content-Type for file uploads
            headers.pop('Content-Type', None)

        try:
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