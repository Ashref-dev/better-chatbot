import { customModelProvider } from "lib/ai/models";
import { getModelProvidersForRole } from "lib/ai/model-access";
import { getSession } from "auth/server";
import { userRepository } from "lib/db/repository";

export const GET = async () => {
  const session = await getSession();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const models = getModelProvidersForRole(
    session.user.role,
    customModelProvider.modelsInfo,
  );
  const preferences = await userRepository.getPreferences(session.user.id);
  const userApiKeys = preferences?.apiKeys ?? {};
  const modelsWithUserKeys = models.map((provider) => ({
    ...provider,
    hasAPIKey: provider.hasAPIKey || Boolean(userApiKeys[provider.provider]),
  }));

  return Response.json(
    modelsWithUserKeys.sort((a, b) => {
      if (a.hasAPIKey && !b.hasAPIKey) return -1;
      if (!a.hasAPIKey && b.hasAPIKey) return 1;
      return 0;
    }),
  );
};
