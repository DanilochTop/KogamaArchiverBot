const { parseSocket, toSocket, Int, String, Byte, ByteArray, TArray, Dictionary, Float, Double, Bool, Short, Long, getPackerInfo, BytePacker } = require("./BytePacker");
const { MVParameterKeys, MVOperationCodes, MVTeams, TransformPackageType } = require("../constants/MVCommon.json");

const ConvertKeysToBytes = (obj) => {
    let result = {};
    Object.entries(obj).forEach(([k, v]) => {
        if ("headeropCodesizeisToClient".includes(k)) result[k] = v;
        else result[MVParameterKeys[k]] = v
    })
    return result;
}
let OperationRequests = {};

OperationRequests.GetPlanetOwnerships = function (ProfileID) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.GetPlanetOwnerships,
        size: 2,
        ProfileID: new Int(ProfileID),
    })
}
OperationRequests.GetAllPlanetPermissions = function (ProfileID) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.GetAllPlanetPermissions,
        size: 2,
        ProfileID: new Int(ProfileID),
    })
}
OperationRequests.AddLink = function (LinkFromID, LinkToID) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.AddLink,
        size: 2,
        LinkFromID: new Int(LinkFromID),
        LinkToID: new Int(LinkToID),
    })
}
OperationRequests.AddObjectLink = function (LinkFromID, LinkToID) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.AddObjectLink,
        size: 2,
        LinkFromID: new Int(LinkFromID),
        LinkToID: new Int(LinkToID),
    })
}
OperationRequests.Ban = function (CheatType) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.Ban,
        size: 1,
        CheatType: new Byte(CheatType),
    })
}
OperationRequests.AdminOperation = function (Amount, ProfileID, OperationType, Message) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.AdminOperation,
        size: 4,
        Amount: new Int(Amount),//amount in hours
        ProfileID: new Int(ProfileID),
        OperationType: new Byte(OperationType),//0:kick,1:ban,2:expel,
        Message: new String(Message),
    })
}
OperationRequests.UploadScreenshot = function (ImageType) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.UploadScreenshot,
        size: 1,
        ImageType: new Byte(1),
    })
}
OperationRequests.UploadBytes = function (Data, Id) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.UploadBytes,
        size: 2,
        Data: new ByteArray(new Uint8Array(Data)),
        Id: new Int(Id),
    })
}
OperationRequests.WorldObjectRPCOperation = function (WorldObjectID, WorldObjectRPCData) {
    //{flags:15,x:0,y:0,z:0,damage:50,interaction:13,type:0,}
    let V1 = Object.assign({}, WorldObjectRPCData)
    V1.type = Console_.MVCommon.MVkillType[WorldObjectRPCData.type]
    V1.interaction = Console_.MVCommon.MVInteractions[WorldObjectRPCData.interaction]
    let Data = [{
        key: new Byte(0),
        value: new ByteArray(new Uint8Array(Console_.BytePacker.setRPC(V1))),
    }]
    return ConvertKeysToBytes({
        WorldObjectID: new Int(WorldObjectID),
        WorldObjectRPCData: new Dictionary(Data, 0, 0),
        header: [243, 2],
        opCode: MVOperationCodes.WorldObjectRPCOperation,
        size: 2
    })
}
OperationRequests.LevelChanged = function (Level) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.LevelChanged,
        size: 1,
        Level: new Int(Level),
    })
}
OperationRequests.SetFirstTimeEvent = function (Id) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.SetFirstTimeEvent,
        size: 1,
        Id: new Int(Id),
    })
}
OperationRequests.Notification = function (NotificationType, NotificationData) {
    let ModifiedData = []
    Object.entries(NotificationData).forEach(p => { ModifiedData.push({ key: new Byte(Console_.MVCommon.NotificationDataType[p[0]]), value: Console_._[p[1][0]](p[1][1]) }) })
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.Notification,
        size: 2,
        NotificationType: new Int(Console_.MVCommon.NotificationDataType[NotificationType]),
        NotificationData: new Dictionary(ModifiedData, 0, 0),
    })
}
OperationRequests.PurchaseProduct = function (ProductTypeID, PurchaseProductData) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.PurchaseProduct,
        size: 2,
        ProductTypeID: new Int(ProductTypeID),
        PurchaseProductData: new Dictionary(PurchaseProductData, 0, 0),
    })
}
OperationRequests.UpdateWorldObject = function (WorldObjectID, PosX, PosY, PosZ, Timestamp, TransformPackageType_, ByteRotation) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.UpdateWorldObject,
        size: 7,
        WorldObjectID: new Int(WorldObjectID),
        PosX: new Float(PosX),
        PosY: new Float(PosY),
        PosZ: new Float(PosZ),
        Timestamp: new Int(Timestamp),
        TransformPackageType: new Byte(TransformPackageType[TransformPackageType_]),
        ByteRotation: new ByteArray(new Uint8Array(ByteRotation))
    })
}
OperationRequests.UpdateWorldObjectRunTimeData = function (WorldObjectID, WorldObjectRunTimeData) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.UpdateWorldObjectRunTimeData,
        size: 2,
        WorldObjectID: new Int(WorldObjectID),
        WorldObjectRunTimeData: new Dictionary(WorldObjectRunTimeData, 0, 0)
    })
}
OperationRequests.SetTeam = function (TeamID) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.SetTeam,
        size: 1,
        TeamID: new Int(MVTeams[TeamID])
    })
}
OperationRequests.ReportCaptureFlag = function (Id) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.ReportCaptureFlag,
        size: 1,
        Id: new Int(Id)
    })
}
OperationRequests.ReportReachedTimeAttackFlag = function (Id, Timestamp) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.ReportReachedTimeAttackFlag,
        size: 2,
        Id: new Int(Id),
        Timestamp: new Int(Timestamp),
    })
}
OperationRequests.ResetAvatars = function (AvatarID) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.ResetAvatars,
        size: 1,
        AvatarID: new Int(AvatarID),
    })
}
OperationRequests.ClaimPlayingNewGameRewardedGold = function () {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.ClaimPlayingNewGameRewardedGold,
        size: 0,
    })
}
OperationRequests.ClaimRewardedAdXP = function (Bool) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.ClaimRewardedAdXP,
        size: 1,
        Bool: new Bool(Bool)
    })
}
OperationRequests.ClaimGamePointWelcomeReward = function () {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.ClaimGamePointWelcomeReward,
        size: 0,
    })
}
OperationRequests.ResetTerrain = function () {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.ResetTerrain,
        size: 0,
    })
}
OperationRequests.GetResetAvatar = function (WorldObjectID) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.GetResetAvatar,
        size: 1,
        WorldObjectID: new Int(WorldObjectID),
    })
}
OperationRequests.ResetLogicChunk = function (WorldObjectID) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.ResetLogicChunk,
        size: 1,
        WorldObjectID: new Int(WorldObjectID),
    })
}
OperationRequests.SetMaterial = function (MaterialID) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.SetMaterial,
        size: 1,
        MaterialID: new Int(MaterialID),
    })
}
OperationRequests.SetActiveSpawnRole = function (Id) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.SetActiveSpawnRole,
        size: 1,
        Id: new Int(Id),
    })
}
OperationRequests.UpdateWorldObjectDataPartial = function (WorldObjectID, WorldObjectData) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.UpdateWorldObjectDataPartial,
        size: 2,
        WorldObjectData: new Dictionary(WorldObjectData, 0, 0),
        WorldObjectID: new Int(WorldObjectID)
    })
}
OperationRequests.PostChatMsg = function (GameMsgType, Msg, ActorNr) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.PostChatMsg,
        size: 2,
        GameMsgType: new Int(Console_.MVCommon.MVGameMsgType[GameMsgType]),
        Message: new Dictionary([
            { key: new Byte(0), value: new Int(ActorNr) },
            { key: new Byte(5), value: new String(Msg) },
        ], 0, 0)
    })
}
OperationRequests.SetSayChatBubbleVisible = function (Bool_) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.SetSayChatBubbleVisible,
        size: 1,
        Data: new Dictionary([{ key: new String("V"), value: new Bool(Bool_) }], 0, 0)
    })
}

OperationRequests.UnregisterWorldObject = function (WorldObjectID) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.UnregisterWorldObject,
        size: 1,
        WorldObjectID: new Int(WorldObjectID)
    })
}
OperationRequests.CloneWorldObjectTree = function (WorldObjectID, OwnerActorNr, CloneToRootGroup, SetAsPreviewItem) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.CloneWorldObjectTree,
        size: 4,
        OwnerActorNr: new Int(OwnerActorNr),
        WorldObjectID: new Int(WorldObjectID),
        CloneToRootGroup: new Bool(CloneToRootGroup),
        SetAsPreviewItem: new Bool(SetAsPreviewItem),
    })
}
OperationRequests.TriggerBoxEnter = function (WorldObjectIDs) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.TriggerBoxEnter,
        size: 1,
        WorldObjectID: new TArray([new Int(WorldObjectIDs[0]), new Int(WorldObjectIDs[1])], 105)
    })
}
OperationRequests.TriggerBoxExit = function (WorldObjectIDs) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.TriggerBoxExit,
        size: 1,
        WorldObjectID: new TArray([new Int(WorldObjectIDs[0]), new Int(WorldObjectIDs[1])], 105)
    })
}
OperationRequests.UpdateLineOfFire = function (WorldObjectID, CamDirX, CamDirY, CamDirZ, CamOriginX, CamOriginY, CamOriginZ) {
    return ConvertKeysToBytes({
        WorldObjectID: new Int(WorldObjectID),
        CamDirX: new Float(CamDirX),
        CamDirY: new Float(CamDirY),
        CamDirZ: new Float(CamDirZ),
        CamOriginX: new Float(CamOriginX),
        CamOriginY: new Float(CamOriginY),
        CamOriginZ: new Float(CamOriginZ),
        header: [243, 2],
        opCode: MVOperationCodes.UpdateLineOfFire,
        size: 7,
    })

}
OperationRequests.UpdatePrototype = function (WorldInventoryID, WorldInventoryData) {
    WorldInventoryData = Object.assign({ action: 4, x: 0, y: 0, z: 0, material: 1, flags: 12, corners: null, materials: null }, WorldInventoryData)
    return ConvertKeysToBytes({
        WorldInventoryID: new Int(WorldInventoryID),
        WorldInventoryData: new ByteArray(BytePacker.setWorldInventoryData(WorldInventoryData)),
        header: [243, 2],
        opCode: MVOperationCodes.UpdatePrototype,
        size: 2
    })
}
OperationRequests.SpawnVehicleWithDriver = function (WorldObjectIDs, PosX, PosY, PosZ, RotX, RotY, RotZ, RotW, SeatID, SeatType) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.SpawnVehicleWithDriver,
        size: 10,
        WorldObjectIDs: new Dictionary([
            { key: new Byte(0), value: new Int(WorldObjectIDs[0]) },//PlayModeAvatar
            { key: new Byte(1), value: new Int(WorldObjectIDs[1]) },//WorldObjectSpawnerVehicle
        ], 0, 0),
        PosX: new Float(PosX),
        PosY: new Float(PosY),
        PosZ: new Float(PosZ),
        RotX: new Float(RotX),
        RotY: new Float(RotY),
        RotZ: new Float(RotZ),
        RotW: new Float(RotW),
        SeatID: new Byte(SeatID),
        SeatType: new Byte(SeatType),
    })
}
OperationRequests.DetachWorldObjectFromVehicle = function (WorldObjectID) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.DetachWorldObjectFromVehicle,
        size: 1,
        WorldObjectID: new Int(WorldObjectID),//PlayModeAvata
    })
}
OperationRequests.SetAvatarAccessorySlot = function (AvatarID, StreamingAssetID, AvatarAccessoryOffset, Scale) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.SetAvatarAccessorySlot,
        size: 4,
        AvatarID: new Int(AvatarID),
        AvatarAccessoryOffset: new Float(AvatarAccessoryOffset),
        Scale: new Float(Scale),
        StreamingAssetID: new Int(StreamingAssetID),
    })
}
OperationRequests.UnEquipAccessory = function (AvatarID, Id) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.UnEquipAccessory,
        size: 2,
        AvatarID: new Int(AvatarID),
        Id: new Int(Id),
    })
}
OperationRequests.TransferOwnership = function (FinalizeTransform, WorldObjectID, OwnerActorNr, PosX, PosY, PosZ, RotX, RotY, RotZ, RotW) {
    return ConvertKeysToBytes(Object.assign({
        header: [243, 2],
        opCode: MVOperationCodes.TransferOwnership,
        size: FinalizeTransform ? 10 : 3,
        FinalizeTransform: new Bool(FinalizeTransform),
        OwnerActorNr: new Int(OwnerActorNr),
        WorldObjectID: new Int(WorldObjectID),
    }, FinalizeTransform ? {
        PosX: new Float(PosX),
        PosY: new Float(PosY),
        PosZ: new Float(PosZ),
        RotX: new Float(RotX),
        RotY: new Float(RotY),
        RotZ: new Float(RotZ),
        RotW: new Float(RotW),
    } : {}))
}
OperationRequests.AddWorldObjectToInventory = function (WorldObjectID) {
    return ConvertKeysToBytes({
        WorldObjectID: new Int(WorldObjectID),
        header: [243, 2],
        opCode: MVOperationCodes.AddWorldObjectToInventory,
        size: 1,
    })
}
OperationRequests.CloneTempWorldObjectWithOriginalReference = function (OwnerActorNr, CloneToRootGroup, WorldObjectID, PosX, PosY, PosZ, RotX, RotY, RotZ, RotW, TransferOwnershipToServerOnLeave, IsTempObject, SetAsPreviewItem) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.CloneTempWorldObjectWithOriginalReference,
        size: 13,
        OwnerActorNr: new Int(OwnerActorNr),
        WorldObjectID: new Int(WorldObjectID),
        CloneToRootGroup: new Bool(CloneToRootGroup),
        SetAsPreviewItem: new Bool(SetAsPreviewItem),
        IsTempObject: new Bool(IsTempObject),
        PosX: new Float(PosX),
        PosY: new Float(PosY),
        PosZ: new Float(PosZ),
        RotX: new Float(RotX),
        RotY: new Float(RotY),
        RotZ: new Float(RotZ),
        RotW: new Float(RotW),
        TransferOwnershipToServerOnLeave: new Bool(TransferOwnershipToServerOnLeave),
    })
}
OperationRequests.RequestBuiltInItem = function (BuiltInType, WorldObjectGroupID, OwnerActorNr, PosX, PosY, PosZ, RotX, RotY, RotZ, RotW, ScaleX, ScaleY, ScaleZ, Data, TransferOwnershipToServerOnLeave) {
    return ConvertKeysToBytes({
        OwnerActorNr: new Int(OwnerActorNr),
        WorldObjectGroupID: new Int(WorldObjectGroupID),
        BuiltInType: new Byte(BuiltInType),
        PosX: new Float(PosX),
        PosY: new Float(PosY),
        PosZ: new Float(PosZ),
        RotX: new Float(RotX),
        RotY: new Float(RotY),
        RotZ: new Float(RotZ),
        RotW: new Float(RotW),
        ScaleX: new Float(ScaleX),
        ScaleY: new Float(ScaleY),
        ScaleZ: new Float(ScaleZ),
        TransferOwnershipToServerOnLeave: new Bool(TransferOwnershipToServerOnLeave),
        Data: new Dictionary([
            { key: new Byte(1), value: new Float(Data[0]) },//protoTypeSize
            { key: new Byte(2), value: new Byte(Data[1]) },//MaterialId
            { key: new Byte(3), value: new Int(Data[2]) },//ProfilId
        ], 0, 0),
        header: [243, 2],
        opCode: MVOperationCodes.RequestBuiltInItem,
        size: 15
    })
}

OperationRequests.AddItemToWorld = function (OwnerActorNr, WorldObjectGroupID, PosX, PosY, PosZ, RotX, RotY, RotZ, RotW, TransferOwnershipToServerOnLeave, ItemID, IsPreviewItem) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.AddItemToWorld,
        size: 12,
        OwnerActorNr: new Int(OwnerActorNr),
        WorldObjectGroupID: new Int(WorldObjectGroupID),
        PosX: new Float(PosX),
        PosY: new Float(PosY),
        PosZ: new Float(PosZ),
        RotX: new Float(RotX),
        RotY: new Float(RotY),
        RotZ: new Float(RotZ),
        RotW: new Float(RotW),
        TransferOwnershipToServerOnLeave: new Bool(TransferOwnershipToServerOnLeave),
        ItemID: new Int(ItemID),
        IsPreviewItem: new Bool(IsPreviewItem)
    })
}
OperationRequests.AddAvatarToAvatarShopInventory = function (AvatarName, WorldObjectID) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.AddAvatarToAvatarShopInventory,
        size: 2,
        AvatarName: new String(AvatarName),
        AvatarName: new Int(AvatarName),
    })
}
OperationRequests.RuntimeEvent = function (Data) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.RuntimeEvent,
        size: 1,
        Data: new ByteArray(Console_.BytePacker.setRuntime(Data)),
    })
}
OperationRequests.ClaimGamePointWelcomeReward = function () {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.ClaimGamePointWelcomeReward,
        size: 0
    })
}
OperationRequests.UpdatePrototypeScale = function (Scale, WorldInventoryID) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.UpdatePrototypeScale,
        size: 2,
        Scale: new Float(Scale),
        WorldInventoryID: new Int(WorldInventoryID),
    })
}
OperationRequests.Join = function (Password, PlayerSessionID, PlanetID, GameMode, RegionCode, ProfileToken, NewGameId, ClientBuildTarget, MetaData, Count) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.Join,
        size: 12,
        Password: new String(Password),
        PlayerSessionID: new String(PlayerSessionID),
        PlanetID: new Int(PlanetID),
        GameMode: new Int(GameMode),
        RegionCode: new String(RegionCode),
        ProfileToken: new String(ProfileToken),
        NewGameId: new String(NewGameId),
        ClientBuildTarget: new Byte(ClientBuildTarget),
        MetaData: new Int(MetaData),
        Count: new Int(Count),
        ClientVerificationData: new String("[]"),
        Version: new String("3.1.22.1153"),
    })
}
OperationRequests.Handshake = function () {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.Handshake,
        size: 0
    })
}
OperationRequests.Syncronize = function () {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.Syncronize,
        size: 0
    })
}
OperationRequests.IncrementStatRequest = function (Id) {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.IncrementStatRequest,
        size: 1,
        Id: new Short(Id)
    })
}
OperationRequests.StartSessionTime = function () {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.StartSessionTime,
        size: 0
    })
}
OperationRequests.RequestAccessoryData = function () {
    return ConvertKeysToBytes({
        header: [243, 2],
        opCode: MVOperationCodes.RequestAccessoryData,
        size: 0
    })
}

OperationRequests.GamePing = function (DBQueryOutData) {
    return ConvertKeysToBytes({
        header: [243, 6],
        opCode: 1,
        size: 1,
        DBQueryOutData: new Int(DBQueryOutData)
    })
}
module.exports = OperationRequests;