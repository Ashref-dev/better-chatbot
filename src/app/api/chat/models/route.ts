import { customModelProvider } from "lib/ai/models";
import { getModelProvidersForRole } from "lib/ai/model-access";
import { getSession } from "auth/server";

export const GET = async () => {
  const session = await getSession();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const models = getModelProvidersForRole(
    session.user.role,
    customModelProvider.modelsInfo,
  );

  return Response.json(
    models.sort((a, b) => {
      if (a.hasAPIKey && !b.hasAPIKey) return -1;
      if (!a.hasAPIKey && b.hasAPIKey) return 1;
      return 0;
    }),
  );
};
