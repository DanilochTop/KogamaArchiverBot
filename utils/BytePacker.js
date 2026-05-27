
const MVCommon = require("../constants/MVCommon.json")

function Enum(_) {
	var g = {};
	var c = 0;
	_.replaceAll(' ', '').replaceAll('\t', '').split(',').map(p => {
		if (p.includes('//') && p.includes('\n')) {
			p = p.replace(/\/\/.*?\n/g, "");
		}
		if (p.includes('\n')) {
			p = p.replaceAll('\n', '')
		}
		if (p != '') {
			if (p.includes('=')) {
				g[p.split('=')[0]] = JSON.parse(p.split('=')[1])
				c = p.split('=')[1]
			} else {
				g[p] = c
			}
		}
		c++
	})
	return g
}



class StreamBuffer {
	constructor(array = []) { this.index = 0; this.array = new Uint8Array(array); }
	readByte() { return this.array[this.index++]; }
	read(count) {
		let arr = new Uint8Array(Math.min(count, this.array.length - this.index));
		for (let i = 0; i < arr.length; i++)arr.set([this.readByte()], i);
		return arr;
	}
	writeByte(byte) { this.array = new Uint8Array([...this.array, byte]); this.index++; }
	write(array) { for (let i = 0; i < array.length; i++)this.writeByte(array[i]) }
}
function protoReverse() {
	return this.map(a => new this.constructor(new Uint8Array(new this.constructor([a]).buffer).reverse().buffer)[0])
}
function protoByte() {
	return new Uint8Array(this.reversed().buffer);
}
Int32Array.prototype.bytes = protoByte;
Int32Array.prototype.reversed = protoReverse;
Int16Array.prototype.bytes = protoByte;
Int16Array.prototype.reversed = protoReverse;
Float32Array.prototype.bytes = protoByte
Float32Array.prototype.reversed = protoReverse
class TType {
	constructor(type, typeCode, value) { this.type = type; this.typeCode = typeCode; this.value = value; }
	result() { return this.value }//bytes
	size() { return this.value.length }//number
	read(buf, full = 0, size = -1) {
		let res = new this.constructor(new Uint8Array(
			buf.read(size + 1 ? size : this.size())
		));
		return full ? res : res.value;
	}
	write(buf, full = 0) {
		if (full) buf.writeByte(this.typeCode);
		buf.write(this.result());
	}
}
class Byte extends TType {
	constructor(value = 0) { if (value.buffer) { super('Byte', 98, value[0]) } else { super('Byte', 98, value); } }
	result(full = 0) { return new Uint8Array([...(full ? [this.typeCode] : []), this.value]); }
	size() { return 1; }
}
class Bool extends TType {
	constructor(value = 0) { if (value.buffer) { super('Bool', 111, value[0] ? 1 : 0) } else { super('Bool', 111, value ? 1 : 0); } }
	result(full = 0) { return new Uint8Array([...(full ? [this.typeCode] : []), this.value ? 1 : 0]); }
	size() { return 1; }
}
class Short extends TType {
	constructor(value = 0) { if (value.buffer) { super('Short', 107, new Int16Array(value.reverse().buffer)[0]) } else { super('Short', 107, value); } }
	result(full = 0) { return new Uint8Array([...(full ? [this.typeCode] : []), ...new Int16Array([this.value]).bytes()]); }
	size() { return 2; }
}
class Int extends TType {
	constructor(value = 0) { if (value.buffer) { super('Int', 105, new Int32Array(value.reverse().buffer)[0]) } else { super('Int', 105, value); } }
	result(full = 0) { return new Uint8Array([...(full ? [this.typeCode] : []), ...new Int32Array([this.value]).bytes()]); }
	size() { return 4; }
}
class Long extends TType {
	constructor(value = 0) { if (value.buffer) { super('Long', 108, new BigInt64Array(value.reverse().buffer)[0]) } else { super('Long', 108, value); } }
	result(full = 0) { return new Uint8Array([...(full ? [this.typeCode] : []), ...new BigInt64Array([this.value]).bytes()]); }
	size() { return 8; }
}
class Float extends TType {
	constructor(value = 0) { if (value.buffer) { super('Float', 102, new Float32Array(value.reverse().buffer)[0]) } else { super('Float', 102, value); } }
	result(full = 0) { return new Uint8Array([...(full ? [this.typeCode] : []), ...new Float32Array([this.value]).bytes()]); }
	size() { return 4; }
}
class Double extends TType {
	constructor(value = 0) { if (value.buffer) { super('Double', 100, new Double64Array(value.reverse().buffer)[0]) } else { super('Double', 100, value); } }
	result(full = 0) { return new Uint8Array([...(full ? [this.typeCode] : []), ...new Float64Array([this.value]).bytes()]); }
	size() { return 8; }
}
class ByteArray extends TType {
	constructor(value = []) { super('ByteArray', 120, new Uint8Array([...value])) }
	result(full = 0) {
		return new Uint8Array([
			...(full ? [this.typeCode] : []),
			...new Int(this.size()).result(),
			...this.value
		]);
	}
	size() { return this.value.length; }
	read(buf, full = 0, size = -1) {
		size = size + 1 ? size : new Int().read(buf);
		let res = new this.constructor(new Uint8Array(buf.read(size)));
		return full ? res : res.value;
	}
}
class Null extends TType {
	constructor(value = 0) { super('Null', 42, null); }
	result(full = 0) { return new Uint8Array([...(full ? [this.typeCode] : [])]); }
	size() { return 0; }
}
class String extends TType {
	constructor(value = '') { if (value.buffer) { super('String', 115, new TextDecoder().decode(value)) } else { super('String', 115, value); } }
	size() { return new TextEncoder().encode(this.value).length }
	result(full = 0) {
		return new Uint8Array([
			...(full ? [this.typeCode] : []),
			...new Short(this.size()).result(),
			...new TextEncoder().encode(this.value)
		]);
	}
	read(buf, full = 0, size = -1) {
		size = size + 1 ? size : new Short().read(buf);
		let res = new this.constructor(new Uint8Array(buf.read(size)));
		return full ? res : res.value;
	}
}
class TArray extends TType {//{key:value,...}
	constructor(value = [], TValue = 121) { super('TArray', 121, value); this.TValue = TValue; }
	size() { return this.value.length }
	result(full = 0) {
		let arr = [];
		for (let k in this.value) {
			if (this.value[k].result) {
				arr = [
					...arr,
					...this.value[k].result()
				];
			}
		}
		if (this.TValue == 98) {
			return new Uint8Array([
				...(full ? [this.typeCode] : []),
				...new Short(this.value.size()).result(),
				...new Byte(this.TValue).result(),
				...this.value.value
			]);
		}
		return new Uint8Array([
			...(full ? [this.typeCode] : []),
			...new Short(this.size()).result(),
			...new Byte(this.TValue).result(),
			...arr
		]);
	}
	read(buf, full = 0, size = -1) {
		size = size + 1 ? size : new Short().read(buf);
		let b = new Byte().read(buf);//type
		let arr = new this.constructor([], b);
		if (b == 121) {//TArray
			arr.value = [new TArray().read(buf, full)];
			for (let i = 1; i < size; i++)
				arr.value[i] = new TArray().read(buf, full);
		} else {
			if (b == 120) {//Array<ByteArray>
				for (let i = 0; i < size; i++)
					arr.value[i] = new ByteArray().read(buf, full);
			} else {
				if (b == 98) {//ByteArray
					arr.value = new ByteArray().read(buf, full, size);
				} else {
					if (b == 105) {//IntArray
						for (let i = 0; i < size; i++)
							arr.value[i] = new Int().read(buf, full);
					} else {
						if (b == 68) {//Dictionary
							for (let i = 0; i < size; i++)
								arr.value[i] = new Dictionary().read(buf, full);
							return full ? arr : arr.value;
						}
						for (let i = 0; i < size; i++)
							arr.value[i] = new Call().read(buf, full, b);//other types
					}
				}
			}
		}
		return full ? arr : arr.value;
	}
}
class Hashtable extends TType {//{key:value,...}
	constructor(value = {}) { super('Hashtable', 104, value); }
	size() { return Object.keys(this.value).length }
	result(full = 0) {
		let arr = [];
		for (let k in this.value) {
			if (this.value[k].result) {
				arr = [
					...arr,
					...new Byte(Number(k)).result(1),
					...this.value[k].result(1)
				];
			}
		}
		return new Uint8Array([
			...(full ? [this.typeCode] : []),
			...new Short(this.size()).result(),
			...arr
		]);
	}
	read(buf, full = 0, size = -1) {
		size = size + 1 ? size : new Short().read(buf);
		let arr = {};
		for (let i = 0; i < size; i++) {
			let key = new Call().read(buf);
			let value = new Call().read(buf, full);
			if (!(key === null)) {
				arr[key] = value;
			}
		}
		let res = new this.constructor(arr);
		return full ? res : res.value;
	}
}
class Dictionary extends TType {//[ {key:"",value:{}},... ]
	constructor(value = [], TKey, TValue) { super('Dictionary', 68, value); this.TKey = TKey; this.TValue = TValue; }
	size() { return this.value.length }

	result(full = 0) {
		let arr = [];
		for (let i in this.value) {
			arr = [
				...arr,
				...this.value[i].key.result(this.TKey == 0),
				...this.value[i].value.result(this.TValue == 0)
			];
		}
		return new Uint8Array([
			...(full ? [this.typeCode] : []),
			...new Byte(this.TKey).result(),
			...new Byte(this.TValue).result(),
			...new Short(this.size()).result(),
			...arr
		]);
	}
	read(buf, full = 0, size = -1) {
		let TKey = new Byte().read(buf);
		let TValue = new Byte().read(buf);
		size = new Short().read(buf);
		let arr = [];
		for (let i = 0; i < size; i++) {
			let key = new Call().read(buf, full, TKey || -1);
			let value = new Call().read(buf, full, TValue || -1);
			if (!(key === null)) {
				arr.push({ key, value });
			}
		}
		let res = new this.constructor(arr, TKey, TValue);
		return full ? res : res.value;
	}
}
class Call {
	constructor() { }
	read(buf, full = 0, type = -1) {
		type = type + 1 ? type : new Byte().read(buf);
		if (!type) throw "No type: " + type;
		if (!GpType[type]) throw "Unknown typeCode: " + type;
		return new GpType[type]().read(buf, full)
	}
}
const GpType = {
	0: 0 && Unknown,
	42: Null,

	111: Bool,
	98: Byte,
	107: Short,
	105: Int,
	108: Long,
	102: Float,
	100: Double,
	115: String,

	121: TArray,
	120: ByteArray,
	119: 0 && IntArray,
	97: 0 && StringArray,
	122: 0 && ObjectArray,

	104: Hashtable,
	68: Dictionary,

	99: 0 && Custom,
	101: 0 && EventData,
	113: 0 && OperationRequest,
	112: 0 && OperationResponse
};
function parseSocket(arr0, full = 1) {
	let isToClient = false;
	if ((arr0[1] == 3 || arr0[1] == 7) && arr0[5] == 42) {
		isToClient = true;
		arr0 = [...arr0.slice(0, 3), ...arr0.slice(6)];
	}
	if (arr0.length == 3) return { header: [...arr0.slice(0, 2)], opCode: arr0[2], result: function () { return toSocket(this) } };
	//243,2,opCode,length,length
	let buf = new StreamBuffer(arr0); buf.index = 3;
	let arr = {
		isToClient,
		header: [...arr0.slice(0, 2)],
		opCode: arr0[2],
		size: new Short().read(buf)
	};
	for (let i = 0; i < arr.size; i++) {
		let slot = new Byte().read(buf);
		arr[slot] = new Call().read(buf, full);
	}
	arr.result = function () { return toSocket(this) };
	return arr;
}
function toSocket(arr) {
	let buf = new StreamBuffer();
	buf.write(arr.header);
	buf.writeByte(arr.opCode);
	size = GetSize(arr);
	if (size > -1) {
		new Short(size).write(buf);
		if (size > 0) {
			for (let k in arr) {
				if (!['size', 'header', 'opCode', 'result', 'isToClient'].includes(k)) {
					buf.writeByte(Number(k));
					arr[k].write(buf, 1);
				}
			}
		}
	}
	if ((buf.array[1] == 3 || buf.array[1] == 7) && arr.isToClient) {
		return [...buf.array.slice(0, 3), 0, 0, 42, ...buf.array.slice(3)];
	} else {
		return buf.array;
	}
}
function w7bit(buf, n) {
	for (; n >= 128; n >>= 7)buf.writeByte((n | 128) % 256);
	buf.writeByte(n % 256);
};
function r7bit(buf) {
	let num = 0;
	let num2 = 0;
	while (num2 != 35) {
		let b = buf.readByte();
		num |= (b & 127) << num2;
		if ((b & 128) == 0) { return num; }
		num2 += 7;
	}
};
//window.getDictPackerDataTypes=top.getDictPackerDataTypes={}
let TypeGameSapShot = {
	'0': 'Int',
	'1': 'Int Array',
	'2': 'Float',
	'3': 'Float Array',
	'5': 'Bool',
	'6': 'Bool Array',
	'7': 'String',
	'8': 'Dictionary',
	'9': 'Byte',
	'10': 'Long',
	'11': 'Long Array',
}
let WorldObjectCode = Enum(`

		// Token: 0x04000277 RID: 631

		PlayModeAvatar,
		// Token: 0x04000278 RID: 632

		CubeModel,
		// Token: 0x04000279 RID: 633

		PointLight,
		// Token: 0x0400027A RID: 634

		TriggerBox,
		// Token: 0x0400027B RID: 635

		Mover,
		// Token: 0x0400027C RID: 636

		Path,
		// Token: 0x0400027D RID: 637

		PathNode,
		// Token: 0x0400027E RID: 638

		SpawnPoint,
		// Token: 0x0400027F RID: 639

		CubeModelPrototypeTerrain,
		// Token: 0x04000280 RID: 640

		Group,
		// Token: 0x04000281 RID: 641

		Action,
		// Token: 0x04000282 RID: 642

		BlueprintActivator,
		// Token: 0x04000283 RID: 643

		ParticleEmitter,
		// Token: 0x04000284 RID: 644

		SoundEmitter,
		// Token: 0x04000285 RID: 645

		BlueprintFire,
		// Token: 0x04000286 RID: 646

		BlueprintSmoke,
		// Token: 0x04000287 RID: 647

		BlueprintExplosion,
		// Token: 0x04000288 RID: 648

		Flag,
		// Token: 0x04000289 RID: 649

		TestLogicCube,
		// Token: 0x0400028A RID: 650

		Battery,
		// Token: 0x0400028B RID: 651

		ToggleBox,
		// Token: 0x0400028C RID: 652

		Negate,
		// Token: 0x0400028D RID: 653

		And,
		// Token: 0x0400028E RID: 654

		Explosives,
		// Token: 0x0400028F RID: 655

		TextMsg,
		// Token: 0x04000290 RID: 656

		Fire,
		// Token: 0x04000291 RID: 657

		Smoke,
		// Token: 0x04000292 RID: 658

		TimeTrigger,
		// Token: 0x04000293 RID: 659

		Teleporter,
		// Token: 0x04000294 RID: 660

		Goal,
		// Token: 0x04000295 RID: 661

		PickupItemHealthPack,
		// Token: 0x04000296 RID: 662

		PickupItemCenterGun,
		// Token: 0x04000297 RID: 663

		CubeModelTerrainFineGrained,
		// Token: 0x04000298 RID: 664

		PressurePlate,
		// Token: 0x04000299 RID: 665

		PickupItemImpulseGun,
		// Token: 0x0400029A RID: 666

		PickupItemBazookaGun,
		// Token: 0x0400029B RID: 667

		PickupItemRailGun,
		// Token: 0x0400029C RID: 668

		PickupItemSpawner,
		// Token: 0x0400029D RID: 669

		Skybox,
		// Token: 0x0400029E RID: 670

		SpawnPointRed,
		// Token: 0x0400029F RID: 671

		SpawnPointGreen,
		// Token: 0x040002A0 RID: 672

		SpawnPointYellow,
		// Token: 0x040002A1 RID: 673

		SpawnPointBlue,
		// Token: 0x040002A2 RID: 674

		ModelToggle,
		// Token: 0x040002A3 RID: 675

		WaterPlane,
		// Token: 0x040002A4 RID: 676

		Blueprint,
		// Token: 0x040002A5 RID: 677

		PulseBox,
		// Token: 0x040002A6 RID: 678

		RandomBox,
		// Token: 0x040002A7 RID: 679

		SentryGun,
		// Token: 0x040002A8 RID: 680

		CollectibleItem,
		// Token: 0x040002A9 RID: 681

		MovingPlatformNode,
		// Token: 0x040002AA RID: 682

		WaterPlanePreset,
		// Token: 0x040002AB RID: 683

		LightPreset,
		// Token: 0x040002AC RID: 684

		Ghost,
		// Token: 0x040002AD RID: 685

		PickupCubeGun,
		// Token: 0x040002AE RID: 686

		CheckPoint,
		// Token: 0x040002AF RID: 687

		HoverCraft,
		// Token: 0x040002B0 RID: 688

		WorldObjectSpawnerVehicle,
		// Token: 0x040002B1 RID: 689

		MonoPlane,
		// Token: 0x040002B2 RID: 690

		JetPack,
		// Token: 0x040002B3 RID: 691

		RoundCube,
		// Token: 0x040002B4 RID: 692

		AdvancedGhost,
		// Token: 0x040002B5 RID: 693

		HamsterWheel,
		// Token: 0x040002B6 RID: 694

		KillLimit,
		// Token: 0x040002B7 RID: 695

		OculusKillLimit,
		// Token: 0x040002B8 RID: 696

		CountingCube,
		// Token: 0x040002B9 RID: 697

		VehicleEnergy = 118,
		// Token: 0x040002BA RID: 698

		WorldObjectSpawnerVehicleEnergy,
		// Token: 0x040002BB RID: 699

		Jakob6,
		// Token: 0x040002BC RID: 700

		Jakob7,
		// Token: 0x040002BD RID: 701

		Jakob8,
		// Token: 0x040002BE RID: 702

		Jakob9,
		// Token: 0x040002BF RID: 703

		Jakob10,
		// Token: 0x040002C0 RID: 704

		Jakob11,
		// Token: 0x040002C1 RID: 705

		Jakob12,
		// Token: 0x040002C2 RID: 706

		Jakob13,
		// Token: 0x040002C3 RID: 707

		Jakob14,
		// Token: 0x040002C4 RID: 708

		Jakob15,
		// Token: 0x040002C5 RID: 709

		GamePoint,
		// Token: 0x040002C6 RID: 710

		GamePassProgressionDataObject,
		// Token: 0x040002C7 RID: 711

		Christian3,
		// Token: 0x040002C8 RID: 712

		BuildModeAvatar,
		// Token: 0x040002C9 RID: 713

		AvatarSpawnRoleCreator,
		// Token: 0x040002CA RID: 714

		GameOptionsDataObject,
		// Token: 0x040002CB RID: 715

		ModelTransparency,
		// Token: 0x040002CC RID: 716

		Christian8,
		// Token: 0x040002CD RID: 717

		Christian9,
		// Token: 0x040002CE RID: 718

		Christian10,
		// Token: 0x040002CF RID: 719

		Christian11,
		// Token: 0x040002D0 RID: 720

		Christian12,
		// Token: 0x040002D1 RID: 721

		Christian13,
		// Token: 0x040002D2 RID: 722

		Christian14,
		// Token: 0x040002D3 RID: 723

		Christian15,
		// Token: 0x040002D4 RID: 724

		CameraSettings,
		// Token: 0x040002D5 RID: 725

		GravityCube,
		// Token: 0x040002D6 RID: 726

		GameCoin = 148,
		// Token: 0x040002D7 RID: 727

		GameCoinChest,
		// Token: 0x040002D8 RID: 728

		Theme,
		// Token: 0x040002D9 RID: 729

		Door,
		// Token: 0x040002DA RID: 730

		DoorBlueprint,
		// Token: 0x040002DB RID: 731

		PickupMeleeWeapon,
		// Token: 0x040002DC RID: 732

		PickupMeleeWeaponBlueprint,
		// Token: 0x040002DD RID: 733

		PickupCostume,
		// Token: 0x040002DE RID: 734

		PickupCostumeBlueprint,
		// Token: 0x040002DF RID: 735

		Caspar13,
		// Token: 0x040002E0 RID: 736

		Caspar14,
		// Token: 0x040002E1 RID: 737

		Caspar15,
		// Token: 0x040002E2 RID: 738

		ShrinkGun,
		// Token: 0x040002E3 RID: 739

		TeamEditor,
		// Token: 0x040002E4 RID: 740

		TriggerCube,
		// Token: 0x040002E5 RID: 741

		Thomas4,
		// Token: 0x040002E6 RID: 742

		CollectTheItemCollectableInstance,
		// Token: 0x040002E7 RID: 743

		ShootableButton,
		// Token: 0x040002E8 RID: 744

		UseLever,
		// Token: 0x040002E9 RID: 745

		CollectTheItemDropOff,
		// Token: 0x040002EA RID: 746

		CollectTheItemCollectable,
		// Token: 0x040002EB RID: 747

		CollectTheItem,
		// Token: 0x040002EC RID: 748

		WindTurbine,
		// Token: 0x040002ED RID: 749

		GlobalSoundEmitter,
		// Token: 0x040002EE RID: 750

		Mathias3,
		// Token: 0x040002EF RID: 751

		Mathias4,
		// Token: 0x040002F0 RID: 752

		Mathias5,
		// Token: 0x040002F1 RID: 753

		Mathias6,
		// Token: 0x040002F2 RID: 754

		Mathias7,
		// Token: 0x040002F3 RID: 755

		Mathias8,
		// Token: 0x040002F4 RID: 756

		Mathias9,
		// Token: 0x040002F5 RID: 757

		Mathias10,
		// Token: 0x040002F6 RID: 758

		TimeAttackFlag,
		// Token: 0x040002F7 RID: 759

		GamePointChest,
		// Token: 0x040002F8 RID: 760

		Marcus3,
		// Token: 0x040002F9 RID: 761

		Marcus4,
		// Token: 0x040002FA RID: 762

		Marcus5,
		// Token: 0x040002FB RID: 763

		Marcus6,
		// Token: 0x040002FC RID: 764

		Marcus7,
		// Token: 0x040002FD RID: 765

		Marcus8,
		// Token: 0x040002FE RID: 766

		Marcus9,
		// Token: 0x040002FF RID: 767

		Marcus10

`)

const BytePacker = {
	getAvatarsMeta(e) {
		let buf = new StreamBuffer(e),
			Length = new Int().read(buf),
			t = {},
			EncodedAvatarsMetaData = e.slice(4)
		for (let i = 0; i < Length; i++) {
			let d = EncodedAvatarsMetaData.slice(0, EncodedAvatarsMetaData[8] + 15);
			let buf = new StreamBuffer(d),
				WorldObjectID = new Int().read(buf)
			t[WorldObjectID] = Object.assign(this.getAvatarMeta(d.slice(4)), { WorldObjectID })
			EncodedAvatarsMetaData = EncodedAvatarsMetaData.slice(EncodedAvatarsMetaData[8] + 15);
		}
		return t
	},
	setAvatarsMeta(e) {
		let buf = new StreamBuffer();
		new Int(Object.keys(e).length).write(buf);
		for (let a in e) {
			if (!isNaN(Number(a))) {
				new Int(a).write(buf);
				buf.write(this.setAvatarMeta(e[a]));
			}
		}
		return buf.array;
	},
	getAvatarMeta(e) {
		let buf = new StreamBuffer(e);
		let AvatarID = new Int().read(buf),
			AvatarName = new String().read(buf, 0, r7bit(buf)),
			PriceGold = new Int().read(buf),
			IsOnMarketPlace = new Bool().read(buf),
			CanBeSoldOnMarketPlace = new Bool().read(buf);

		return { AvatarID, AvatarName, PriceGold, IsOnMarketPlace, CanBeSoldOnMarketPlace };
	},
	setAvatarMeta({ AvatarID, AvatarName, PriceGold, IsOnMarketPlace, CanBeSoldOnMarketPlace }) {
		let buf = new StreamBuffer();
		let t = [];
		new Int(AvatarID).write(buf);
		w7bit(buf, AvatarName.length);
		new String(AvatarName).write(buf, 0, 0);
		new Int(PriceGold).write(buf);
		new Bool(IsOnMarketPlace).write(buf);
		new Bool(CanBeSoldOnMarketPlace).write(buf);
		return buf.array;
	},
	getRPC(e) {
		let output = {};
		const ByteFlags = {
			InteractionType: 1,
			Damage: 2,
			Impulse: 4,
			PlayerKilledByType: 8,

		}
		let buf = new StreamBuffer(e);
		output.damage = 0;
		output.interactionType = MVCommon.MVInteractions.None;
		output.impulse = { X: 0, Y: 0, Z: 0 };
		output.playerKilledByType = MVCommon.MVkillType.None;
		let byteFlags = buf.readByte();
		output.byteFlags = byteFlags;
		if ((byteFlags & ByteFlags.InteractionType) != 0) {
			output.interactionType = buf.readByte();
		}
		let sharedData = {
			damage: {
				9: 11.5,
				6: 110,
				4: 100,
				7: 13,
				14: 12.5,
				19: 12.5,
				5: 15,
				15: 15,
				24: 12,
				26: 25
			}[output.interactionType] || 0,
			impulse: { X: 0, Y: 0, Z: 0 },
			playerKilledByType: MVCommon.MVkillType.None
		};
		if ((byteFlags & ByteFlags.Damage) != 0) {
			output.damage = new Float().read(buf);
		} else {
			output.damage = sharedData.damage;
		}
		if ((byteFlags & ByteFlags.Impulse) != 0) {
			output.impulse = {
				X: new Float().read(buf),
				Y: new Float().read(buf),
				Z: new Float().read(buf),
			};
		}
		else {
			output.impulse = sharedData.impulse;
		}
		if ((byteFlags & ByteFlags.PlayerKilledByType) != 0) {
			output.playerKilledByType = buf.readByte();
			return output;
		}
		output.playerKilledByType = sharedData.playerKilledByType;
		return output;

	},
	setRPC(e) {
		let input = { ...e };
		let buf = new StreamBuffer();
		const ByteFlags = {
			InteractionType: 1,
			Damage: 2,
			Impulse: 4,
			PlayerKilledByType: 8,
		}
		buf.writeByte(input.byteFlags || 0);
		if (input.interactionType != MVCommon.MVInteractions.None) {
			buf.writeByte(input.interactionType || 0);
			input.byteFlags |= ByteFlags.InteractionType;
		}
		if (input.damage != 0) {
			new Float(input.damage || 0).write(buf);
			input.byteFlags |= ByteFlags.Damage;
		}
		let sqrMagnitude = Math.sqrt((input.impulse.X || 0) ** 2 + (input.impulse.Y || 0) ** 2 + (input.impulse.Z || 0) ** 2);
		if (sqrMagnitude > 1e-05) {
			new Float(input.impulse.X || 0).write(buf);
			new Float(input.impulse.Y || 0).write(buf);
			new Float(input.impulse.Z || 0).write(buf);
			input.byteFlags |= ByteFlags.Impulse;
		}
		if (input.playerKilledByType != MVCommon.MVkillType.None) {
			buf.writeByte(input.playerKilledByType || 0);
			input.byteFlags |= ByteFlags.PlayerKilledByType;
		}
		let arr = buf.array;
		arr[0] = input.byteFlags || 0;
		return arr;
	},
	getRunTimeData(buf, isPosAnArray = true) {
		let i = Object.fromEntries(Object.entries(MVCommon.RuntimeEventType).map(e => e.reverse())),
			typekey = new Byte().read(buf),
			material = -1,
			objectType = "Undefined",
			type = i[typekey] || "Undefined";
		if ([1, 2, 5].includes(typekey)) {
			objectType = "SingleCube";
			if (typekey == 1) material = new Byte().read(buf);
		} else {
			objectType = "Explosion";
		}
		let x = new Short().read(buf),
			y = new Short().read(buf),
			z = new Short().read(buf);

		return Object.assign({ objectType, type }, material >= 0 ? { material } : {}, isPosAnArray ? { pos: [x, y, z] } : { x, y, z })
	},
	setRunTimeData(buf, e) {
		let typeKey = MVCommon.RuntimeEventType[e.type];
		new Byte(typeKey).write(buf);
		if (typeKey == 1) new Byte(e.material > -1 ? e.material : 0).write(buf);
		new Short(e.pos ? e.pos[0] : e.x).write(buf);
		new Short(e.pos ? e.pos[1] : e.y).write(buf);
		new Short(e.pos ? e.pos[2] : e.z).write(buf);
		return buf.array;
	},
	getWorldInventoryData(e) {
		let buf = new StreamBuffer(e),
			action = new Byte().read(buf),
			c = this.getCube(buf, true, action);
		c.action = action;
		return c;
	},
	setWorldInventoryData(c) {
		let buf = new StreamBuffer();
		new Byte(c.action).write(buf);
		this.setCube(buf, c, c.action);
		return buf.array;
	},
	getCube(buf, isPosAnArray = true, Type) {
		let c = {};
		//c.action = new Byte().read(buf);
		let x = new Short().read(buf),
			y = new Short().read(buf),
			z = new Short().read(buf);
		c = Object.assign(c, isPosAnArray ? { pos: [x, y, z] } : { x, y, z });
		if (Type) {
			c.flags = new Byte().read(buf);
			if ((c.flags & 1) == 0) c.corners = [...new ByteArray().read(buf, 0, 8)];
			if ((c.flags & 2) == 0) c.materials = [...new ByteArray().read(buf, 0, 6)];
			else c.material = new Byte().read(buf);
		}
		return c;
	},
	setCube(buf, c, Type) {
		new Short(c.pos ? c.pos[0] : c.x).write(buf);
		new Short(c.pos ? c.pos[1] : c.y).write(buf);
		new Short(c.pos ? c.pos[2] : c.z).write(buf);
		if (Type) {
			new Byte(c.flags).write(buf);
			if ((c.flags & 1) == 0) buf.write(c.corners)
			if ((c.flags & 2) == 0) buf.write(c.materials)
			else new Byte(c.material).write(buf);
		}
		return buf.array;
	}
}
const GetSize = (e) => {
	var c = 0
	Object.entries(e).forEach(l => {
		if (/\d/.test(l[0])) {
			c++
		}
	})
	return c
}

const getWorldObjectData = buf => {
	let data = {};
	let num = new Int().read(buf);
	if (num > 1e3) throw "Params Can Never Reach 1e3 in length";
	for (let i2 = 0; i2 < num; i2++) {
		const key = new String().read(buf, 0, r7bit(buf));
		const type = new Byte().read(buf);
		//DictPackerDataTypes[key]=TypeGameSnapShot[type]
		let value = 0;
		let len2 = 0;
		switch (type) {
			case 0:
				value = new Int().read(buf);
				break;
			case 1://int array
				value = [];
				len2 = new Int().read(buf);
				for (let i = 0; i < len2; i++) {
					value.push(new Int().read(buf));
				}
				break;
			case 2:
				value = new Float().read(buf);
				break;
			case 3:
				value = [];
				len2 = new Int().read(buf);
				for (let i = 0; i < len2; i++) {
					value.push(new Float().read(buf));
				}
				break;
			case 5:
				value = new Bool().read(buf);
				break;
			case 6:
				value = [];
				len2 = new Int().read(buf);
				for (let i = 0; i < len2; i++) {
					value.push(new Bool().read(buf));
				}
				break;
			case 7:
				value = new String().read(buf, 0, r7bit(buf));
				break;
			case 8:
				value = getWorldObjectData(buf)
				break;
			case 9:
				value = new Byte().read(buf);
				break;
			case 10:
				value = new Long().read(buf);
				break;
			case 11:
				value = [];
				len2 = new Int().read(buf);
				for (let i = 0; i < len2; i++) {
					value.push(new Long().read(buf));
				}
				break;
		}
		data[key] = type == 8 ? value : [value, type];
	}
	return data;
};
const getWorldRunTimeData = buf => {
	let chunk = [];
	let num = new Int().read(buf);
	for (let i = 0; i < num; i++) chunk.push(BytePacker.getRunTimeData(buf, false));
	return chunk;
};
const getWorldCubes = buf0 => {
	let buf = new StreamBuffer(new ByteArray().read(buf0));
	let chunk = [];
	let num = new Int().read(buf);
	for (let i = 0; i < num; i++) {
		let cube = Object.assign(BytePacker.getCube(buf, false, 1), { inRow: false });
		chunk.push(cube);
		for (let i2 = 1; i2 < (cube.flags >> 2); i2++) {
			let clone = Object.assign({}, cube, { inRow: true });
			clone.x += i2;
			chunk.push(clone);
		}
	}
	return chunk;
};
const getWorldObjects = (buf) => {
	let chunk = [],
		count = new Int().read(buf);//11812
	for (let i = 0; i < count; i++) {
		let Id = new Int().read(buf);
		let GroupId = new Int().read(buf);
		let ItemId = new Int().read(buf);
		let WorldObjectType = new Int().read(buf);
		let WorldObjectTypeId = WorldObjectType
		WorldObjectType = WorldObjectTypes[WorldObjectTypeId] || WorldObjectTypeId;
		let Position = { X: new Float().read(buf), Y: new Float().read(buf), Z: new Float().read(buf) };
		let Rotation = { X: new Float().read(buf), Y: new Float().read(buf), Z: new Float().read(buf), W: new Float().read(buf) };
		let Scale = { X: new Float().read(buf), Y: new Float().read(buf), Z: new Float().read(buf) };
		let Data = getWorldObjectData(buf);
		let OwnerShipFlag = new Byte().read(buf);
		let PreviewOwnerProfileId = null;
		let OwnerActorNumber = null;
		if ((OwnerShipFlag & 1) != 0) OwnerActorNumber = new Int().read(buf);
		if ((OwnerShipFlag & 2) != 0) PreviewOwnerProfileId = new Int().read(buf);
		let RuntimeData = getWorldObjectData(buf);
		chunk.push({
			Id,
			GroupId,
			ItemId,
			WorldObjectType,
			WorldObjectTypeId,
			Position,
			Rotation,
			Scale,
			Data,
			OwnerShipFlag,
			OwnerActorNumber,
			PreviewOwnerProfileId,
			RuntimeData
		});
	}
	return chunk;
};
const getWorldPrototypes = (buf) => {
	let chunk = [],
		count = new Int().read(buf);
	for (let i = 0; i < count; i++) {
		let Id = new Int().read(buf);
		let Scale = new Float().read(buf);
		let AuthorProfileId = new Int().read(buf);
		let Data = getWorldCubes(buf)
		chunk.push({ Id, Scale, AuthorProfileId, Data });
	}
	return chunk;
};
const getLinks = buf => {
	let chunk = [],
		count = new Int().read(buf);
	for (let i = 0; i < count; i++) {
		let Id = new Int().read(buf);
		let LinkToID = new Int().read(buf);
		let LinkFromID = new Int().read(buf);
		chunk.push({ Id, LinkToID, LinkFromID });
	}
	return chunk;
};

let Sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

function setWorldObjectData(buf, Data) {
	const entries = Object.entries(Data);
	new Int(entries.length).write(buf);
	for (let entry of entries) {
		let type = null;
		let value = null;
		let key = entry[0];
		if (entry[1].length == undefined) (type = 8, value = entry[1])
		if (entry[1].length != undefined) (type = entry[1][1], value = entry[1][0])
		w7bit(buf, key.length);
		buf.write([...new String(key).result()].slice(2));
		new Byte(type).write(buf);
		switch (type) {
			case 0: {
				new Int(value).write(buf);
			}
				break;
			case 1: case 4: {
				new Int(Object.keys(value).length).write(buf);
				for (let i = 0; i < Object.keys(value).length; i++) {
					new Int(Object.keys(value)[i]).write(buf);
				}
			}
				break;
			case 2: {
				new Float(value).write(buf);
			}
				break;
			case 3: {
				new Int(value.length).write(buf);
				for (let i = 0; i < value.length; i++) {
					new Float(value[i]).write(buf);
				}
			}
				break;
			case 5: {
				new Bool(value).write(buf);
			}
				break;
			case 6: {
				new Int(value.length).write(buf);
				for (let i = 0; i < value.length; i++) {
					new Bool(value[i]).write(buf);
				}
			}
				break;
			case 7: {
				w7bit(buf, value.length);
				buf.write([...new String(value).result()].slice(2));
			}
				break;
			case 8: {
				setWorldObjectData(buf, value);
			}
				break;
			case 9: {
				new Byte(value).write(buf);
			}
				break;
			case 10: {
				new Long(value).write(buf);
			}
				break;
			case 11: {
				new Int(value.length).write(buf);
				for (let i = 0; i < value.length; i++) {
					new Long(value[i]).write(buf);
				}
			}
				break;
			default:
				throw new Error("Unknown Type: " + type + " || " + JSON.stringify(value))
		}
	}
}
async function setPrototypes(buf, data, callback) {
	new Int(data.length).write(buf);

	for (let prototype of data) {

		let pourcent = data.indexOf(prototype) * 100 / data.length;
		console.log("Prototype: " + pourcent);

		new Int(prototype.Id).write(buf);
		new Float(prototype.Scale).write(buf);
		new Int(prototype.AuthorProfileId).write(buf);
		await Sleep(1);
		let dataStream = new StreamBuffer();
		const CubesInRow = prototype.Data.filter(cube => !cube.inRow);
		new Int(CubesInRow.length).write(dataStream)

		for (let cube of CubesInRow) {
			let pourcent = prototype.Data.indexOf(cube) * 100 / prototype.Data.length;
			console.log("Cubes: " + pourcent);
			new Short(cube.x).write(dataStream);
			new Short(cube.y).write(dataStream);
			new Short(cube.z).write(dataStream);
			new Byte(cube.flags).write(dataStream);
			if ((cube.flags & 1) == 0) dataStream.write(cube.corners);
			if ((cube.flags & 2) == 0) dataStream.write(cube.materials);
			else new Byte(cube.material).write(dataStream);
		}
		new ByteArray(dataStream.array).write(buf);
	}
	callback(buf);
}
async function setWorldObjects(buf, data, callback) {
	new Int(data.length).write(buf);

	for (let worldObject of data) {
		let pourcent = data.indexOf(worldObject) * 100 / data.length;
		console.log("worldObject: " + pourcent);
		await Sleep(1);
		new Int(worldObject.Id).write(buf);
		new Int(worldObject.GroupId).write(buf);
		new Int(worldObject.ItemId).write(buf);
		new Int(worldObject.WorldObjectTypeId).write(buf);

		new Float(worldObject.Position.X).write(buf);
		new Float(worldObject.Position.Y).write(buf);
		new Float(worldObject.Position.Z).write(buf);

		new Float(worldObject.Rotation.X).write(buf);
		new Float(worldObject.Rotation.Y).write(buf);
		new Float(worldObject.Rotation.Z).write(buf);
		new Float(worldObject.Rotation.W).write(buf);

		new Float(worldObject.Scale.X).write(buf);
		new Float(worldObject.Scale.Y).write(buf);
		new Float(worldObject.Scale.Z).write(buf);

		setWorldObjectData(buf, worldObject.Data);

		const ownerStatArray = [worldObject.OwnerActorNumber, worldObject.PreviewOwnerProfileId];
		if (ownerStatArray[0] == null && ownerStatArray[1] == null) new Byte(0).write(buf);
		if (ownerStatArray[0] != null && ownerStatArray[1] == null) new Byte(1).write(buf);
		if (ownerStatArray[0] == null && ownerStatArray[1] != null) new Byte(2).write(buf);
		if (ownerStatArray[0] != null && ownerStatArray[1] != null) new Byte(3).write(buf);
		if (worldObject.OwnerActorNumber != null) new Int(ownerStatArray[0]).write(buf);
		if (worldObject.PreviewOwnerProfileId != null) new Int(ownerStatArray[1]).write(buf);
		setWorldObjectData(buf, worldObject.RuntimeData);
	}
	callback(buf);
}
async function setLinks(buf, data, callback) {
	new Int(data.length).write(buf);
	for (let link of data) {
		let pourcent = data.indexOf(link) * 100 / data.length;
		new Int(link.Id).write(buf);
		new Int(link.LinkFromID).write(buf);
		new Int(link.LinkToID).write(buf);
	}
	callback(buf);
}
async function setRuntimeEvents(buf, data, callback) {
	new Int(data.length).write(buf)
	callback(buf);
}
async function setWorld(World, callback) {
	let buf = new StreamBuffer([]);
	setPrototypes(buf, World.Prototypes, function (buf1) {
		setWorldObjects(buf1, World.WorldObjects, function (buf2) {
			setLinks(buf2, World.Links, function (buf3) {
				setLinks(buf3, World.ObjectLinks, function (buf4) {
					setRuntimeEvents(buf4, [], function (buf5) {
						//buf5.write([0,0,0,0, 0,0,0,0])
						callback(buf5.array);
					});
				});
			});
		});
	});
}



const WorldObjectTypes = Object.fromEntries(Object.entries(WorldObjectCode).map(a => a.reverse()));

function getPackerInfo(BytePacker) {
	try {
		let result = {};
		let buf = new StreamBuffer(BytePacker)
		result.Prototypes = getWorldPrototypes(buf);
		result.WorldObjects = getWorldObjects(buf);
		result.Links = getLinks(buf);
		result.ObjectLinks = getLinks(buf);
		//result.runtime = getRunTimeData(buf.array);

		return result;
	} catch (e) { console.error(e); }
}









module.exports = { StreamBuffer, Byte, String, Int, Long, Short, Double, Float, TArray, Dictionary, Hashtable, ByteArray, Bool, BytePacker, parseSocket, toSocket, getPackerInfo }