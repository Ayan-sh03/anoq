#!/bin/bash

# AnoQ Backend API Comprehensive Test Suite - Bash Version
# Tests all endpoints with the new session-based auth system

BASE_URL="http://localhost:8080"
OUTPUT_FILE="test-results.md"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Test counters
TEST_COUNT=0
PASS_COUNT=0
FAIL_COUNT=0
ISSUES_FOUND=()

# Test data
REGISTERED_EMAIL="test$(date +%s)@example.com"
REGISTERED_PASSWORD="password123"
AUTH_TOKEN=""
CREATED_USER_ID=""
CREATED_FORM_ID=""
CREATED_FORM_SLUG=""
CREATED_QUESTION_ID=""
CREATED_RESPONSE_ID=""

# Helper functions
write_test_header() {
    echo -e "\n${CYAN}=== $1 ===${NC}"
    echo -e "\n## $1\n" >> "$OUTPUT_FILE"
}

write_test_case() {
    local test_name="$1"
    local status="$2"
    local details="$3"
    local issues="$4"
    
    ((TEST_COUNT++))
    
    if [[ "$status" == "PASS" ]]; then
        ((PASS_COUNT++))
        echo -e "${GREEN}✅ $test_name${NC}"
    else
        ((FAIL_COUNT++))
        echo -e "${RED}❌ $test_name${NC}"
        if [[ -n "$issues" ]]; then
            ISSUES_FOUND+=("**$test_name**: $issues")
        fi
    fi
    
    echo -e "### $test_name - $status\n" >> "$OUTPUT_FILE"
    echo -e "$details\n" >> "$OUTPUT_FILE"
    if [[ -n "$issues" ]]; then
        echo -e "**Issues Found**: $issues\n" >> "$OUTPUT_FILE"
    fi
}

api_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local auth_header="$4"
    
    local url="$BASE_URL$endpoint"
    local curl_args=(-s -w "HTTP_STATUS:%{http_code}" -L)
    
    # Add method
    curl_args+=(-X "$method")
    
    # Add headers
    curl_args+=(-H "Content-Type: application/json")
    if [[ -n "$auth_header" ]]; then
        curl_args+=(-H "Authorization: Bearer $auth_header")
    fi
    
    # Add data if provided
    if [[ -n "$data" ]]; then
        curl_args+=(-d "$data")
    fi
    # echo "curl ${curl_args[@]}" 
    # Make request
    local response=$(curl "${curl_args[@]}" "$url")
    
    # Extract status code
    local status_code=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    local body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')
    
    echo "$status_code|$body"
}

extract_json_value() {
    local json="$1"
    local key="$2"
    # Handle both string values and nested object values
    echo "$json" | grep -o "\"$key\":\"[^\"]*\"" | cut -d'"' -f4
}

extract_nested_json_value() {
    local json="$1"
    local parent_key="$2"
    local child_key="$3"
    # Extract nested values like form.id from {"form":{"id":"value"}}
    echo "$json" | grep -o "\"$parent_key\":{[^}]*\"$child_key\":\"[^\"]*\"" | grep -o "\"$child_key\":\"[^\"]*\"" | cut -d'"' -f4
}

# Initialize output file
echo "# AnoQ Backend API Test Results" > "$OUTPUT_FILE"
echo "Generated: $(date)" >> "$OUTPUT_FILE"
echo "Base URL: $BASE_URL" >> "$OUTPUT_FILE"

echo -e "${YELLOW}Starting AnoQ Backend API Comprehensive Test Suite...${NC}"
echo -e "${YELLOW}Base URL: $BASE_URL${NC}"

# Test 1: Health Check Endpoints
write_test_header "1. Health Check Endpoints"

result=$(api_request "GET" "/health")
status_code=$(echo "$result" | cut -d'|' -f1)
if [[ "$status_code" == "200" ]]; then
    write_test_case "Health Check" "PASS" "Health endpoint returns 200 OK"
else
    write_test_case "Health Check" "FAIL" "Expected 200, got $status_code" "Health endpoint not working"
fi

result=$(api_request "GET" "/ready")
status_code=$(echo "$result" | cut -d'|' -f1)
if [[ "$status_code" == "200" ]]; then
    write_test_case "Ready Check" "PASS" "Ready endpoint returns 200 OK"
else
    write_test_case "Ready Check" "FAIL" "Expected 200, got $status_code" "Ready endpoint not working"
fi

# Test 2: Authentication Endpoints
write_test_header "2. Authentication Endpoints"

# Test 2.1: Register User
echo -e "${GRAY}Attempting to register user with email: $REGISTERED_EMAIL${NC}"
register_data="{\"email\":\"$REGISTERED_EMAIL\",\"password\":\"$REGISTERED_PASSWORD\",\"given_name\":\"Test\",\"family_name\":\"User\"}"
result=$(api_request "POST" "/api/auth/register" "$register_data")
status_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)

echo -e "${GRAY}Register response status: $status_code${NC}"
echo -e "${GRAY}Register response body: $body${NC}"

if [[ "$status_code" == "201" ]]; then
    token=$(extract_json_value "$body" "token")
    user_id=$(extract_json_value "$body" "id")
    if [[ -n "$token" ]]; then
        write_test_case "Register User - Valid" "PASS" "Successfully registered user and received token"
        CREATED_USER_ID="$user_id"
        echo -e "${GREEN}Registration successful - will get token from login${NC}"
    else
        write_test_case "Register User - Valid" "FAIL" "Expected token in response" "User registration failed"
    fi
else
    write_test_case "Register User - Valid" "FAIL" "Expected 201, got $status_code. Response: $body" "User registration failed"
fi

# Test 2.2: Register Duplicate User
result=$(api_request "POST" "/api/auth/register" "$register_data")
status_code=$(echo "$result" | cut -d'|' -f1)
if [[ "$status_code" == "409" ]]; then
    write_test_case "Register User - Duplicate" "PASS" "Correctly returns 409 Conflict for duplicate email"
else
    write_test_case "Register User - Duplicate" "FAIL" "Expected 409, got $status_code" "Duplicate user registration not handled"
fi

# Test 2.3: Login - Valid
echo -e "${GRAY}Attempting to login with email: $REGISTERED_EMAIL${NC}"
login_data="{\"email\":\"$REGISTERED_EMAIL\",\"password\":\"$REGISTERED_PASSWORD\"}"
result=$(api_request "POST" "/api/auth/login" "$login_data")
status_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)

echo -e "${GRAY}Login response status: $status_code${NC}"
echo -e "${GRAY}Login response body: $body${NC}"

if [[ "$status_code" == "200" ]]; then
    AUTH_TOKEN=$(extract_json_value "$body" "token")
    if [[ -n "$AUTH_TOKEN" ]]; then
        write_test_case "Login - Valid" "PASS" "Successfully logged in and received token"
        echo -e "${GREEN}LOGIN TOKEN STORED: $AUTH_TOKEN${NC}"
    else
        write_test_case "Login - Valid" "FAIL" "Expected token in response" "Login failed"
    fi
else
    write_test_case "Login - Valid" "FAIL" "Expected 200, got $status_code. Response: $body" "Login failed"
fi

# Test 2.4: Login - Invalid Password
invalid_login_data="{\"email\":\"$REGISTERED_EMAIL\",\"password\":\"wrongpassword\"}"
result=$(api_request "POST" "/api/auth/login" "$invalid_login_data")
status_code=$(echo "$result" | cut -d'|' -f1)
if [[ "$status_code" == "401" ]]; then
    write_test_case "Login - Invalid Password" "PASS" "Correctly returns 401 Unauthorized for wrong password"
else
    write_test_case "Login - Invalid Password" "FAIL" "Expected 401, got $status_code" "Invalid login was not rejected"
fi

# Test 3: Authenticated User Operations
write_test_header "3. Authenticated User Operations"

# Test 3.1: Get User - With Auth
echo -e "${GRAY}Using auth token: $AUTH_TOKEN${NC}"
result=$(api_request "GET" "/api/user" "" "$AUTH_TOKEN")
status_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)

echo -e "${GRAY}Get User response status: $status_code${NC}"
echo -e "${GRAY}Get User response body: $body${NC}"

if [[ "$status_code" == "200" ]]; then
    write_test_case "Get User - Valid Auth" "PASS" "Successfully fetched authenticated user"
else
    write_test_case "Get User - Valid Auth" "FAIL" "Expected 200, got $status_code. Response: $body" "Failed to fetch user with valid token"
fi

# Test 3.2: Update User - With Auth
update_data="{\"username\":\"updateduser\",\"given_name\":\"UpdatedName\",\"family_name\":\"UpdatedFamily\"}"
result=$(api_request "PUT" "/api/user" "$update_data" "$AUTH_TOKEN")
status_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)

if [[ "$status_code" == "200" ]]; then
    write_test_case "Update User - Valid Auth" "PASS" "Successfully updated user"
else
    write_test_case "Update User - Valid Auth" "FAIL" "Expected 200, got $status_code. Response: $body" "Failed to update user"
fi

# Test 4: Authenticated Form Operations
write_test_header "4. Authenticated Form Operations"

# Test 4.1: Create Form
form_slug="test-form-$(date +%s)"
create_form_data="{\"title\":\"My Test Form\",\"description\":\"A form for testing purposes\",\"slug\":\"$form_slug\"}"
result=$(api_request "POST" "/api/form" "$create_form_data" "$AUTH_TOKEN")
status_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)

if [[ "$status_code" == "201" ]]; then
    CREATED_FORM_ID=$(extract_nested_json_value "$body" "form" "id")
    CREATED_FORM_SLUG=$(extract_nested_json_value "$body" "form" "slug")
    # Fallback to direct extraction if nested fails
    if [[ -z "$CREATED_FORM_ID" ]]; then
        CREATED_FORM_ID=$(extract_json_value "$body" "id")
    fi
    if [[ -z "$CREATED_FORM_SLUG" ]]; then
        CREATED_FORM_SLUG=$(extract_json_value "$body" "slug")
    fi
    write_test_case "Create Form - Valid Auth" "PASS" "Successfully created a form"
    echo -e "${GREEN}Created form ID: $CREATED_FORM_ID, Slug: $CREATED_FORM_SLUG${NC}"
else
    write_test_case "Create Form - Valid Auth" "FAIL" "Expected 201, got $status_code. Response: $body" "Form creation failed"
fi

# Test 4.2: Get Form by ID (Public)
if [[ -n "$CREATED_FORM_ID" ]]; then
    result=$(api_request "GET" "/api/form/$CREATED_FORM_ID")
    status_code=$(echo "$result" | cut -d'|' -f1)
    if [[ "$status_code" == "200" ]]; then
        write_test_case "Get Form By ID - Public" "PASS" "Successfully fetched created form by ID"
    else
        write_test_case "Get Form By ID - Public" "FAIL" "Expected 200, got $status_code" "Failed to get form by ID"
    fi
fi

# Test 4.3: Update Form
if [[ -n "$CREATED_FORM_ID" ]]; then
    update_form_data="{\"title\":\"My Updated Test Form\"}"
    result=$(api_request "PUT" "/api/form/$CREATED_FORM_ID" "$update_form_data" "$AUTH_TOKEN")
    status_code=$(echo "$result" | cut -d'|' -f1)
    if [[ "$status_code" == "200" ]]; then
        write_test_case "Update Form - Valid Auth" "PASS" "Successfully updated the form"
    else
        write_test_case "Update Form - Valid Auth" "FAIL" "Expected 200, got $status_code" "Form update failed"
    fi
fi

# Test 5: Authenticated Question Operations
write_test_header "5. Authenticated Question Operations"

# Test 5.1: Create Question
if [[ -n "$CREATED_FORM_ID" ]]; then
    create_question_data="{\"question_text\":\"What is your favorite color?\",\"type\":\"basic\",\"position\":1}"
    result=$(api_request "POST" "/api/form/$CREATED_FORM_ID/questions" "$create_question_data" "$AUTH_TOKEN")
    status_code=$(echo "$result" | cut -d'|' -f1)
    body=$(echo "$result" | cut -d'|' -f2)
    
    if [[ "$status_code" == "201" ]]; then
        CREATED_QUESTION_ID=$(extract_nested_json_value "$body" "question" "id")
        # Fallback to direct extraction if nested fails
        if [[ -z "$CREATED_QUESTION_ID" ]]; then
            CREATED_QUESTION_ID=$(extract_json_value "$body" "id")
        fi
        write_test_case "Create Question - Valid Auth" "PASS" "Successfully created a question"
        echo -e "${GREEN}Created question ID: $CREATED_QUESTION_ID${NC}"
    else
        write_test_case "Create Question - Valid Auth" "FAIL" "Expected 201, got $status_code. Response: $body" "Question creation failed"
    fi
fi

# Test 5.2: Get Form Questions
if [[ -n "$CREATED_FORM_ID" ]]; then
    result=$(api_request "GET" "/api/form/$CREATED_FORM_ID/questions" "" "$AUTH_TOKEN")
    status_code=$(echo "$result" | cut -d'|' -f1)
    body=$(echo "$result" | cut -d'|' -f2)
    
    if [[ "$status_code" == "200" ]]; then
        write_test_case "Get Form Questions - Valid Auth" "PASS" "Successfully fetched questions for the form"
    else
        write_test_case "Get Form Questions - Valid Auth" "FAIL" "Expected 200, got $status_code. Response: $body" "Fetching questions failed"
    fi
fi

# Test 6: Public Response Submission
write_test_header "6. Public Response Submission"

# Test 6.1: Submit Response
if [[ -n "$CREATED_FORM_ID" && -n "$CREATED_QUESTION_ID" ]]; then
    submit_response_data="{\"form_id\":\"$CREATED_FORM_ID\",\"name\":\"Responder Joe\",\"email\":\"responder@example.com\",\"answers\":[{\"question_id\":\"$CREATED_QUESTION_ID\",\"answer\":\"Blue\"}]}"
    result=$(api_request "POST" "/api/response" "$submit_response_data")
    status_code=$(echo "$result" | cut -d'|' -f1)
    body=$(echo "$result" | cut -d'|' -f2)
    
    if [[ "$status_code" == "201" ]]; then
        CREATED_RESPONSE_ID=$(extract_json_value "$body" "response_id")
        write_test_case "Submit Response - Valid" "PASS" "Successfully submitted a response"
    else
        write_test_case "Submit Response - Valid" "FAIL" "Expected 201, got $status_code. Response: $body" "Response submission failed"
    fi
fi

# Test 7: Authenticated Response Viewing
write_test_header "7. Authenticated Response Viewing"

# Test 7.1: Get Form Submissions
if [[ -n "$CREATED_FORM_SLUG" ]]; then
    result=$(api_request "GET" "/api/form/submissions/$CREATED_FORM_SLUG" "" "$AUTH_TOKEN")
    status_code=$(echo "$result" | cut -d'|' -f1)
    body=$(echo "$result" | cut -d'|' -f2)
    
    if [[ "$status_code" == "200" ]]; then
        write_test_case "Get Form Submissions - Valid Auth" "PASS" "Successfully fetched form submissions"
    else
        write_test_case "Get Form Submissions - Valid Auth" "FAIL" "Expected 200, got $status_code. Response: $body" "Fetching submissions failed"
    fi
fi

# Test 8: Cleanup and Logout
write_test_header "8. Cleanup and Logout"

# Test 8.1: Delete Form
if [[ -n "$CREATED_FORM_ID" ]]; then
    result=$(api_request "DELETE" "/api/form/$CREATED_FORM_ID" "" "$AUTH_TOKEN")
    status_code=$(echo "$result" | cut -d'|' -f1)
    
    if [[ "$status_code" == "200" ]]; then
        write_test_case "Delete Form - Valid Auth" "PASS" "Successfully deleted the form"
    else
        write_test_case "Delete Form - Valid Auth" "FAIL" "Expected 200, got $status_code" "Form deletion failed"
    fi
fi

# Test 8.2: Logout
result=$(api_request "POST" "/api/auth/logout" "" "$AUTH_TOKEN")
status_code=$(echo "$result" | cut -d'|' -f1)

if [[ "$status_code" == "200" ]]; then
    write_test_case "Logout" "PASS" "Successfully logged out"
    old_token="$AUTH_TOKEN"
    AUTH_TOKEN=""
else
    write_test_case "Logout" "FAIL" "Expected 200, got $status_code" "Logout failed"
fi

# Test 8.3: Access Protected Route After Logout
result=$(api_request "GET" "/api/user" "" "$old_token")
status_code=$(echo "$result" | cut -d'|' -f1)

if [[ "$status_code" == "401" ]]; then
    write_test_case "Access After Logout" "PASS" "Correctly denied access to protected route after logout"
else
    write_test_case "Access After Logout" "FAIL" "Expected 401, got $status_code" "Auth token still valid after logout"
fi

# Final Report
write_test_header "Test Summary and Issues Found"

if [[ $TEST_COUNT -gt 0 ]]; then
    pass_rate=$(echo "scale=2; $PASS_COUNT * 100 / $TEST_COUNT" | bc -l)
else
    pass_rate=0
fi

echo -e "### Test Statistics\n" >> "$OUTPUT_FILE"
echo -e "- **Total Tests**: $TEST_COUNT" >> "$OUTPUT_FILE"
echo -e "- **Passed**: $PASS_COUNT" >> "$OUTPUT_FILE"
echo -e "- **Failed**: $FAIL_COUNT" >> "$OUTPUT_FILE"
echo -e "- **Pass Rate**: $pass_rate%\n" >> "$OUTPUT_FILE"

if [[ ${#ISSUES_FOUND[@]} -gt 0 ]]; then
    echo -e "### Critical Issues Found\n" >> "$OUTPUT_FILE"
    for issue in "${ISSUES_FOUND[@]}"; do
        echo -e "- $issue" >> "$OUTPUT_FILE"
    done
else
    echo -e "### No Critical Issues Found\n" >> "$OUTPUT_FILE"
    echo -e "All core authentication and CRUD operations appear to be working correctly." >> "$OUTPUT_FILE"
fi

echo -e "\n${GREEN}=== Test Complete ===${NC}"
echo -e "${NC}Total Tests: $TEST_COUNT${NC}"
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"
echo -e "${NC}Pass Rate: $pass_rate%${NC}"
echo -e "${YELLOW}Results saved to: $OUTPUT_FILE${NC}"

if [[ ${#ISSUES_FOUND[@]} -gt 0 ]]; then
    echo -e "\n${RED}Critical Issues Found:${NC}"
    for issue in "${ISSUES_FOUND[@]}"; do
        echo -e "${RED}- $issue${NC}"
    done
else
    echo -e "\n${GREEN}No critical issues found.${NC}"
fi 