import { type MutationCtx, type QueryCtx } from "./_generated/server";

export async function buildEntityMap(
	ctx: QueryCtx | MutationCtx,
	ids: any[]
): Promise<Map<any, any>> {
	const entities = await Promise.all(ids.map((id) => ctx.db.get(id)));
	const entityMap = new Map();
	for (let i = 0; i < ids.length; i++) {
		entityMap.set(ids[i], entities[i]);
	}
	return entityMap;
}
