import { type MutationCtx, type QueryCtx } from "./_generated/server";

export async function buildEntityMap(
	ctx: QueryCtx | MutationCtx,
	ids: any[]
): Promise<Map<any, any>> {
	const entities = await Promise.all(ids.map((id) => ctx.db.get(id)));
	const entityMap = new Map();
	ids.forEach((id, i) => entityMap.set(id, entities[i]));
	return entityMap;
}
