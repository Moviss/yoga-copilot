# REST API Plan

## 1. Resources

- **Users**: Corresponds to `auth.users` table (managed by Supabase Auth)
- **Asanas**: Corresponds to `asanas` table
- **GeneratedSequences**: Corresponds to `generated_sequences` table
- **SequenceAsanas**: Corresponds to `sequence_asanas` table
- **Feedback**: Corresponds to `feedback` table

## 2. Endpoints

### Asanas

- **GET /api/asanas**
  - Description: Retrieve a list of available asanas
  - Query Parameters:
    - `page`: Page number for pagination (default: 1)
    - `limit`: Number of items per page (default: 20)
    - `is_archived`: Filter by archived status (optional)
  - Response Body:
    ```json
    {
      "data": [
        {
          "id": "string",
          "sanskrit_name": "string",
          "polish_name": "string",
          "illustration_url": "string",
          "is_archived": false,
          "created_at": "string"
        }
      ],
      "pagination": {
        "total": 0,
        "page": 1,
        "limit": 20,
        "pages": 0
      }
    }
    ```
  - Success Codes: 200 OK
  - Error Codes: 401 Unauthorized, 500 Internal Server Error

- **GET /api/asanas/:id**
  - Description: Retrieve a specific asana by ID
  - Response Body:
    ```json
    {
      "id": "string",
      "sanskrit_name": "string",
      "polish_name": "string",
      "illustration_url": "string",
      "is_archived": false,
      "created_at": "string"
    }
    ```
  - Success Codes: 200 OK
  - Error Codes: 401 Unauthorized, 404 Not Found, 500 Internal Server Error

### Generated Sequences

- **POST /api/sequences**
  - Description: Generate a new yoga sequence based on provided parameters
  - Request Body:
    ```json
    {
      "duration_minutes": 15,
      "goal": "flexibility",
      "level": "beginner"
    }
    ```
  - Response Body:
    ```json
    {
      "id": "string",
      "user_id": "string",
      "duration_minutes": 15,
      "goal": "flexibility",
      "level": "beginner",
      "generation_status": "success",
      "created_at": "string",
      "asanas": [
        {
          "step_number": 1,
          "asana": {
            "id": "string",
            "sanskrit_name": "string",
            "polish_name": "string",
            "illustration_url": "string"
          }
        }
      ]
    }
    ```
  - Success Codes: 201 Created
  - Error Codes: 400 Bad Request, 401 Unauthorized, 500 Internal Server Error

- **GET /api/sequences**
  - Description: Retrieve a list of user's generated sequences
  - Query Parameters:
    - `page`: Page number for pagination (default: 1)
    - `limit`: Number of items per page (default: 10)
    - `goal`: Filter by goal (optional)
    - `level`: Filter by level (optional)
    - `status`: Filter by generation status (optional)
  - Response Body:
    ```json
    {
      "data": [
        {
          "id": "string",
          "duration_minutes": 15,
          "goal": "flexibility",
          "level": "beginner",
          "generation_status": "success",
          "created_at": "string",
          "has_feedback": false
        }
      ],
      "pagination": {
        "total": 0,
        "page": 1,
        "limit": 10,
        "pages": 0
      }
    }
    ```
  - Success Codes: 200 OK
  - Error Codes: 401 Unauthorized, 500 Internal Server Error

- **GET /api/sequences/:id**
  - Description: Retrieve a specific generated sequence with its asanas
  - Response Body:
    ```json
    {
      "id": "string",
      "user_id": "string",
      "duration_minutes": 15,
      "goal": "flexibility",
      "level": "beginner",
      "generation_status": "success",
      "created_at": "string",
      "feedback": {
        "status": "accepted",
        "user_comment": "string",
        "created_at": "string"
      },
      "asanas": [
        {
          "step_number": 1,
          "asana": {
            "id": "string",
            "sanskrit_name": "string",
            "polish_name": "string",
            "illustration_url": "string"
          }
        }
      ]
    }
    ```
  - Success Codes: 200 OK
  - Error Codes: 401 Unauthorized, 404 Not Found, 500 Internal Server Error

### Feedback

- **POST /api/sequences/:id/feedback**
  - Description: Provide feedback for a generated sequence
  - Request Body:
    ```json
    {
      "feedback_status": "accepted",
      "user_comment": "string"
    }
    ```
  - Response Body:
    ```json
    {
      "id": "string",
      "generated_sequence_id": "string",
      "feedback_status": "accepted",
      "user_comment": "string",
      "created_at": "string"
    }
    ```
  - Success Codes: 201 Created
  - Error Codes: 400 Bad Request, 401 Unauthorized, 404 Not Found, 409 Conflict (if feedback already exists), 500 Internal Server Error

## 3. Authentication and Authorization

### Authentication Mechanism

- **JWT-based authentication** provided by Supabase Auth
- Every request to a protected endpoint must include an `Authorization` header with a valid JWT token
- Token format: `Bearer <token>`
- Token can be obtained through the authentication endpoints (`/auth/signup` and `/auth/signin`)

### Authorization Rules

- Users can only access their own sequences and provide feedback on their own sequences
- All users can view the list of asanas (read-only)
- Row-level security (RLS) is implemented on the database level to enforce these rules:
  - `asanas`: Read-only access for authenticated users
  - `generated_sequences`: Users can only access their own sequences
  - `sequence_asanas`: Users can only access asanas from their own sequences
  - `feedback`: Users can only access feedback for their own sequences

## 4. Validation and Business Logic

### Validation Rules

#### Asanas
- No validation needed for GET requests (read-only)

#### Generated Sequences
- `duration_minutes`: Must be greater than 0 and less than or equal to 30
- `goal`: Must be one of: 'balance', 'strength', 'flexibility', 'relaxation', 'energy', 'mindfulness'
- `level`: Must be one of: 'beginner', 'intermediate', 'advanced'

#### Feedback
- `feedback_status`: Must be one of: 'accepted', 'rejected'
- `user_comment`: Optional string

### Business Logic Implementation

#### Sequence Generation Process
1. Validate input parameters
2. Create a new record in `generated_sequences` with status 'failure' (default)
3. Send request to LLM API with appropriate prompt
4. Parse LLM response into structured format
5. Create records in `sequence_asanas` for each asana in the sequence
6. Update `generated_sequences` status to 'success'
7. Return the complete sequence with asanas

#### Feedback Collection
1. Validate input parameters
2. Check if sequence exists and belongs to the current user
3. Check if feedback already exists for the sequence (prevent duplicate feedback)
4. Create a new record in `feedback` table
5. Return the created feedback record

#### Error Handling
- Technical errors (API failures, network issues) should return appropriate HTTP status codes
- Application should log errors for debugging and monitoring
- User-friendly error messages should be returned in the response body
