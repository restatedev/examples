import * as restate from "@restatedev/restate-sdk";

const userUpdateRouter = {
    updateUserEvent: restate.keyedEventHandler(async (ctx: restate.RpcContext, event: restate.Event) => {
        const userUpdate: UserUpdate = verifyEvent(event.json());
        await userUpdateRouter.updateUser(ctx, event.key, userUpdate);
    }),

    updateUser: async (ctx: restate.RpcContext, userName: string, userUpdate: UserUpdate) => {
        const userId = await ctx.sideEffect(() => updateUserProfile(userUpdate.userProfile));
        if (userId === NOT_READY) {
            // we send the event to ourselved later
            ctx.sendDelayed(userUpdateAPI, 5 * 1000).updateUser(userName, userUpdate);
            return;
        }

        const roleId = await ctx.sideEffect(() => setupUserPermissions(userId, userUpdate.permissions));
        await ctx.sideEffect(() => provisionResources(userId, roleId, userUpdate.resourceProfile));
    }
}

const userUpdateService = restate.keyedRouter(userUpdateRouter)
const userUpdateAPI: restate.ServiceApi<typeof userUpdateService> = { path: "user_updates" }

restate.createServer()
    .bindKeyedRouter(userUpdateAPI.path, userUpdateService)
    .listen(9080);




















// -------------------------- stubs for this example --------------------------

type UserUpdate = {
    userProfile: string,
    permissions: string,
    resourceProfile: string
}

const NOT_READY = "NOT_READY";

async function updateUserProfile(profile: string): Promise<string> {
    return Math.random() < 0.8 ? NOT_READY : profile + "-id"
}
async function setupUserPermissions(id: string, permissions: string): Promise<string> {
    return permissions
}
async function provisionResources(user: string, role: string, resources: string) {}

function verifyEvent(request: UserUpdate): UserUpdate {
    return request;
}