# AnoQ Backend API Test Results
Generated: Sun, Jul 13, 2025  7:34:11 PM
Base URL: http://localhost:8080

## 1. Health Check Endpoints

### Health Check - PASS

Health endpoint returns 200 OK

### Ready Check - PASS

Ready endpoint returns 200 OK


## 2. Authentication Endpoints

### Register User - Valid - PASS

Successfully registered user and received token

### Register User - Duplicate - PASS

Correctly returns 409 Conflict for duplicate email

### Login - Valid - PASS

Successfully logged in and received token

### Login - Invalid Password - PASS

Correctly returns 401 Unauthorized for wrong password


## 3. Authenticated User Operations

### Get User - Valid Auth - PASS

Successfully fetched authenticated user

### Update User - Valid Auth - FAIL

Expected 200, got 500. Response: {"error":"Failed to update user"}

**Issues Found**: Failed to update user


## 4. Authenticated Form Operations

### Create Form - Valid Auth - PASS

Successfully created a form

### Get Form By ID - Public - FAIL ✔️

Expected 200, got 404

**Issues Found**: Failed to get form by ID

### Update Form - Valid Auth - FAIL

Expected 200, got 500

**Issues Found**: Form update failed ✔️


## 5. Authenticated Question Operations

### Create Question - Valid Auth - FAIL

Expected 201, got 500. Response: {"error":"Failed to get form"}

**Issues Found**: Question creation failed

### Get Form Questions - Valid Auth - FAIL

Expected 200, got 500. Response: {"error":"Failed to get form"}

**Issues Found**: Fetching questions failed


## 6. Public Response Submission


## 7. Authenticated Response Viewing

### Get Form Submissions - Valid Auth - FAIL

Expected 200, got 500. Response: {"error":"Failed to get form"}

**Issues Found**: Fetching submissions failed


## 8. Cleanup and Logout

### Delete Form - Valid Auth - PASS

Successfully deleted the form

### Logout - PASS

Successfully logged out

### Access After Logout - PASS

Correctly denied access to protected route after logout


## Test Summary and Issues Found

### Test Statistics

- **Total Tests**: 17
- **Passed**: 11
- **Failed**: 6
- **Pass Rate**: %

### Critical Issues Found

- **Update User - Valid Auth**: Failed to update user
- **Get Form By ID - Public**: Failed to get form by ID
- **Update Form - Valid Auth**: Form update failed
- **Create Question - Valid Auth**: Question creation failed
- **Get Form Questions - Valid Auth**: Fetching questions failed
- **Get Form Submissions - Valid Auth**: Fetching submissions failed
