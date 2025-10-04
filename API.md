# Polymart API Documentation

Base URL: `https://youthful-lark-845.convex.site`

## Authentication

Most endpoints require authentication via API key. Include your API key in the `Authorization` header:

```
Authorization: Bearer YOUR_API_KEY
```

You can generate an API key from your profile page at https://polymart.xyz/keys

## Endpoints

### Polls

#### Get All Polls

```http
GET /api/polls
```

**Query Parameters:**
- `status` (optional): Filter by poll status (`active`, `resolved`, `cancelled`)

**Response:**
```json
{
  "polls": [
    {
      "_id": "abc123",
      "title": "Will it rain tomorrow?",
      "description": "Prediction market for rain forecast",
      "status": "active",
      "createdAt": 1234567890,
      "totalVolume": 1000,
      "totalBets": 15,
      "outcomes": [
        {
          "_id": "out1",
          "title": "Yes",
          "probability": 65.5,
          "volume": 655,
          "betCount": 10
        },
        {
          "_id": "out2",
          "title": "No",
          "probability": 34.5,
          "volume": 345,
          "betCount": 5
        }
      ],
      "creator": {
        "_id": "user1",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

#### Get Single Poll

```http
GET /api/polls/:pollId
```

**Response:**
```json
{
  "poll": {
    "_id": "abc123",
    "title": "Will it rain tomorrow?",
    "description": "Prediction market for rain forecast",
    "status": "active",
    "createdAt": 1234567890,
    "totalVolume": 1000,
    "totalBets": 15,
    "outcomes": [...],
    "creator": {...}
  }
}
```

**Error Response:**
```json
{
  "error": "Poll not found"
}
```
Status: `404`

#### Create Poll

```http
POST /api/polls
```

**Request Body:**
```json
{
  "title": "Will it rain tomorrow?",
  "description": "Prediction market for rain forecast",
  "outcomes": ["Yes", "No"]
}
```

**Required Fields:**
- `title` (string): Poll title
- `outcomes` (array): 2-10 outcome options

**Optional Fields:**
- `description` (string): Poll description

**Response:**
```json
{
  "pollId": "abc123"
}
```
Status: `201`

**Error Responses:**
```json
{
  "error": "Missing required fields: title, outcomes"
}
```
Status: `400`

```json
{
  "error": "Polls must have between 2 and 10 outcomes"
}
```
Status: `400`

### Bets

#### Place Bet

```http
POST /api/bets
```

**Request Body:**
```json
{
  "pollId": "abc123",
  "outcomeId": "out1",
  "pointsWagered": 100
}
```

**Required Fields:**
- `pollId` (string): ID of the poll
- `outcomeId` (string): ID of the outcome to bet on
- `pointsWagered` (number): Amount of points to wager (min: 1)

**Response:**
```json
{
  "bet": {
    "_id": "bet123",
    "pollId": "abc123",
    "outcomeId": "out1",
    "pointsWagered": 100,
    "createdAt": 1234567890
  }
}
```
Status: `201`

**Error Responses:**
```json
{
  "error": "Missing required fields: pollId, outcomeId, pointsWagered"
}
```
Status: `400`

```json
{
  "error": "Insufficient points"
}
```
Status: `400`

```json
{
  "error": "Poll is not active"
}
```
Status: `400`

#### Get User's Bets

```http
GET /api/users/:userId/bets
```

**Response:**
```json
{
  "bets": [
    {
      "_id": "bet123",
      "pollId": "abc123",
      "outcomeId": "out1",
      "pointsWagered": 100,
      "createdAt": 1234567890,
      "poll": {
        "title": "Will it rain tomorrow?",
        "status": "active"
      },
      "outcome": {
        "title": "Yes"
      }
    }
  ]
}
```

### Users

#### Get User

```http
GET /api/users/:userId
```

**Response:**
```json
{
  "user": {
    "_id": "user1",
    "name": "John Doe",
    "email": "john@example.com",
    "points": 1000,
    "createdAt": 1234567890
  },
  "stats": {
    "totalBets": 25,
    "totalWagered": 5000,
    "totalWinnings": 6500,
    "netProfit": 1500,
    "pollsCreated": 3
  }
}
```

**Error Response:**
```json
{
  "error": "User not found"
}
```
Status: `404`

### Admin

#### Resolve Poll

```http
POST /api/admin/polls/:pollId/resolve
```

**Requires Admin Privileges**

**Request Body:**
```json
{
  "winningOutcomeId": "out1",
  "evidenceUrl": "https://example.com/proof",
  "evidenceText": "Official weather report confirms rain"
}
```

**Required Fields:**
- `winningOutcomeId` (string): ID of the winning outcome

**Optional Fields:**
- `evidenceUrl` (string): Link to evidence
- `evidenceText` (string): Description of evidence

**Response:**
```json
{
  "message": "Poll resolved successfully",
  "winnersCount": 10,
  "totalPayout": 1000
}
```
Status: `200`

**Error Responses:**
```json
{
  "error": "Missing required fields: winningOutcomeId"
}
```
Status: `400`

```json
{
  "error": "Not authorized"
}
```
Status: `403`

```json
{
  "error": "Poll is not active"
}
```
Status: `400`

## Rate Limits

- 100 requests per minute per API key
- 1000 requests per day per API key

## Error Codes

- `400` - Bad Request: Invalid parameters or request body
- `401` - Unauthorized: Missing or invalid API key
- `403` - Forbidden: Insufficient permissions
- `404` - Not Found: Resource doesn't exist
- `429` - Too Many Requests: Rate limit exceeded
- `500` - Internal Server Error: Something went wrong on our end

## Examples

### cURL

```bash
# Get all active polls
curl "https://youthful-lark-845.convex.site/api/polls?status=active"

# Create a poll
curl -X POST "https://youthful-lark-845.convex.site/api/polls" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Will Bitcoin reach $100k in 2025?",
    "description": "Market closes Dec 31, 2025",
    "outcomes": ["Yes", "No"]
  }'

# Place a bet
curl -X POST "https://youthful-lark-845.convex.site/api/bets" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "pollId": "abc123",
    "outcomeId": "out1",
    "pointsWagered": 100
  }'
```

### JavaScript

```javascript
const API_BASE = 'https://youthful-lark-845.convex.site';
const API_KEY = 'your_api_key_here';

// Get all polls
const response = await fetch(`${API_BASE}/api/polls`);
const { polls } = await response.json();

// Create a poll
const createResponse = await fetch(`${API_BASE}/api/polls`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Will Bitcoin reach $100k in 2025?',
    description: 'Market closes Dec 31, 2025',
    outcomes: ['Yes', 'No']
  })
});
const { pollId } = await createResponse.json();

// Place a bet
const betResponse = await fetch(`${API_BASE}/api/bets`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    pollId: 'abc123',
    outcomeId: 'out1',
    pointsWagered: 100
  })
});
const { bet } = await betResponse.json();
```

### Python

```python
import requests

API_BASE = 'https://youthful-lark-845.convex.site'
API_KEY = 'your_api_key_here'

# Get all polls
response = requests.get(f'{API_BASE}/api/polls')
polls = response.json()['polls']

# Create a poll
create_response = requests.post(
    f'{API_BASE}/api/polls',
    headers={'Authorization': f'Bearer {API_KEY}'},
    json={
        'title': 'Will Bitcoin reach $100k in 2025?',
        'description': 'Market closes Dec 31, 2025',
        'outcomes': ['Yes', 'No']
    }
)
poll_id = create_response.json()['pollId']

# Place a bet
bet_response = requests.post(
    f'{API_BASE}/api/bets',
    headers={'Authorization': f'Bearer {API_KEY}'},
    json={
        'pollId': 'abc123',
        'outcomeId': 'out1',
        'pointsWagered': 100
    }
)
bet = bet_response.json()['bet']
```

## Support

For questions or issues with the API, please contact support@polymart.xyz or open an issue on our [GitHub repository](https://github.com/roshan-c/polymart).
