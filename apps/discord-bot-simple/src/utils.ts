import { ChatInputCommandInteraction } from "discord.js";

export function getStatusEmoji(status: string): string {
	switch (status) {
		case "active":
			return "🟢";
		case "resolved":
			return "✅";
		default:
			return "❌";
	}
}

export function truncateMessage(message: string, maxLength: number = 2000): string {
	if (message.length > maxLength) {
		return message.substring(0, maxLength - 3) + "...";
	}
	return message;
}

export async function replyWithTruncation(
	interaction: ChatInputCommandInteraction,
	message: string,
	maxLength: number = 2000
): Promise<void> {
	await interaction.editReply({
		content: truncateMessage(message, maxLength),
	});
}
