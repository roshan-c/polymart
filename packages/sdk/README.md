# @polymart/sdk

TypeScript SDK for the Polymart API - A prediction market platform.

## Installation

```bash
npm install @polymart/sdk
```

## Quick Start

```typescript
import { PolymartSDK } from '@polymart/sdk';

const client = new PolymartSDK({
	apiKey: 'your_api_key_here'
});

const { polls } = await client.getPolls();
console.log(polls);
```

## Configuration

The SDK can be configured with the following options:

```typescript
const client = new PolymartSDK({
	baseUrl: 'https://youthful-lark-845.convex.site',
	apiKey: 'your_api_key_here'
});
```

### Options

- `baseUrl` (optional): The base URL of the Polymart API. Defaults to `https://youthful-lark-845.convex.site`
- `apiKey` (optional): Your API key for authenticated requests. Required for creating polls, placing bets, and admin operations.

You can also set these after initialization:

```typescript
const client = new PolymartSDK();
client.setApiKey('your_api_key_here');
client.setBaseUrl('https://custom-url.com');
```

## API Methods

### Polls

#### Get All Polls

```typescript
const { polls } = await client.getPolls();

const { polls } = await client.getPolls({ status: 'active' });
```

**Parameters:**
- `status` (optional): Filter by poll status (`active`, `resolved`, `cancelled`)

#### Get Single Poll

```typescript
const { poll } = await client.getPoll('pollId');
```

**Parameters:**
- `pollId` (required): The ID of the poll

#### Create Poll

```typescript
const { pollId } = await client.createPoll({
	title: 'Will it rain tomorrow?',
	description: 'Prediction market for rain forecast',
	outcomes: ['Yes', 'No']
});
```

**Parameters:**
- `title` (required): Poll title
- `outcomes` (required): Array of 2-10 outcome options
- `description` (optional): Poll description

**Requires authentication**

### Bets

#### Place Bet

```typescript
const { bet } = await client.placeBet({
	pollId: 'abc123',
	outcomeId: 'out1',
	pointsWagered: 100
});
```

**Parameters:**
- `pollId` (required): ID of the poll
- `outcomeId` (required): ID of the outcome to bet on
- `pointsWagered` (required): Amount of points to wager (min: 1)

**Requires authentication**

#### Get User's Bets

```typescript
const { bets } = await client.getUserBets('userId');
```

**Parameters:**
- `userId` (required): The ID of the user

### Users

#### Get User

```typescript
const { user, stats } = await client.getUser('userId');
```

**Parameters:**
- `userId` (required): The ID of the user

### Admin

#### Resolve Poll

```typescript
const result = await client.resolvePoll('pollId', {
	winningOutcomeId: 'out1',
	evidenceUrl: 'https://example.com/proof',
	evidenceText: 'Official weather report confirms rain'
});
```

**Parameters:**
- `pollId` (required): The ID of the poll
- `winningOutcomeId` (required): ID of the winning outcome
- `evidenceUrl` (optional): Link to evidence
- `evidenceText` (optional): Description of evidence

**Requires authentication and admin privileges**

## Error Handling

The SDK throws `PolymartSDKError` for API errors:

```typescript
import { PolymartSDK, PolymartSDKError } from '@polymart/sdk';

const client = new PolymartSDK({ apiKey: 'your_api_key' });

try {
	const { poll } = await client.getPoll('invalid-id');
} catch (error) {
	if (error instanceof PolymartSDKError) {
		console.error('API Error:', error.message);
		console.error('Status Code:', error.statusCode);
		console.error('Response:', error.response);
	}
}
```

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions for all methods and responses:

```typescript
import type { Poll, Bet, User, PollStatus } from '@polymart/sdk';

const { polls }: { polls: Poll[] } = await client.getPolls();
```

## Authentication

Most operations require an API key. You can generate an API key from your profile page at https://polymart.xyz/keys

Include your API key when initializing the SDK:

```typescript
const client = new PolymartSDK({
	apiKey: 'your_api_key_here'
});
```

Operations that require authentication:
- Creating polls
- Placing bets
- Resolving polls (admin only)

## Rate Limits

- 100 requests per minute per API key
- 1000 requests per day per API key

## Examples

### Complete Example

```typescript
import { PolymartSDK } from '@polymart/sdk';

const client = new PolymartSDK({
	apiKey: 'your_api_key_here'
});

async function main() {
	const { pollId } = await client.createPoll({
		title: 'Will Bitcoin reach $100k in 2025?',
		description: 'Market closes Dec 31, 2025',
		outcomes: ['Yes', 'No']
	});
	console.log('Created poll:', pollId);

	const { poll } = await client.getPoll(pollId);
	console.log('Poll details:', poll);

	const outcomeId = poll.outcomes[0]._id;
	const { bet } = await client.placeBet({
		pollId,
		outcomeId,
		pointsWagered: 100
	});
	console.log('Placed bet:', bet);

	const { polls } = await client.getPolls({ status: 'active' });
	console.log('Active polls:', polls.length);
}

main().catch(console.error);
```

## License

ISC

## Support

For questions or issues with the SDK, please open an issue on our [GitHub repository](https://github.com/roshan-c/polymart).
