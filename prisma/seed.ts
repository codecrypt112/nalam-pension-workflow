import { PrismaClient, Role, Category, Stage, Status, EventAction } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

try {
  process.loadEnvFile(".env");
} catch {
  // .env is optional when DATABASE_URL is already provided by the environment
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function yearsAgo(n: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d;
}

async function main() {
  await db.applicationEvent.deleteMany();
  await db.application.deleteMany();
  await db.user.deleteMany();

  const passwordHash = (pw: string) => bcrypt.hashSync(pw, 10);

  const fv1 = await db.user.create({
    data: {
      name: "முருகன் (கிராம நிர்வாக அலுவலர்)",
      username: "fv1",
      passwordHash: passwordHash("Field@123"),
      role: Role.field_verifier,
    },
  });

  const fv2 = await db.user.create({
    data: {
      name: "கமலா (கிராம நிர்வாக அலுவலர்)",
      username: "fv2",
      passwordHash: passwordHash("Field@123"),
      role: Role.field_verifier,
    },
  });

  const ao1 = await db.user.create({
    data: {
      name: "ராஜேந்திரன் (தாசில்தார்)",
      username: "ao1",
      passwordHash: passwordHash("Approve@123"),
      role: Role.approving_officer,
    },
  });

  const ao2 = await db.user.create({
    data: {
      name: "சுந்தரி (வட்டாட்சியர்)",
      username: "ao2",
      passwordHash: passwordHash("Approve@123"),
      role: Role.approving_officer,
    },
  });

  type Seed = {
    applicantName: string;
    age: number;
    gender: string;
    address: string;
    category: Category;
    monthlyIncome: number;
    spouseDeceased?: boolean;
    remarried?: boolean;
    aadhaarNo: string;
    bankAccount: string;
    createdDaysAgo: number;
    stage: Stage;
    status: Status;
    events: Array<{
      daysAgo: number;
      actorId: string;
      stage: Stage;
      action: EventAction;
      remarks: string;
      aiAssisted?: boolean;
      aiEdited?: boolean | null;
    }>;
  };

  const seeds: Seed[] = [
    {
      applicantName: "ராமசாமி",
      age: 68,
      gender: "ஆண்",
      address: "கீழப்பாளையம் கிராமம், திருப்பூர் வட்டம்",
      category: Category.old_age,
      monthlyIncome: 0,
      aadhaarNo: "432198765432",
      bankAccount: "SBIN0001234 / 30012345678",
      createdDaysAgo: 2,
      stage: Stage.stage1,
      status: Status.in_progress,
      events: [],
    },
    {
      applicantName: "முத்துக்கருப்பன்",
      age: 84,
      gender: "ஆண்",
      address: "மேலூர் கிராமம், மதுரை வட்டம்",
      category: Category.old_age,
      monthlyIncome: 0,
      aadhaarNo: "519832741065",
      bankAccount: "IOBA0002345 / 60098765432",
      createdDaysAgo: 6,
      stage: Stage.stage1,
      status: Status.in_progress,
      events: [],
    },
    {
      applicantName: "பாக்கியம்",
      age: 45,
      gender: "பெண்",
      address: "செட்டிகுளம், உசிலம்பட்டி வட்டம்",
      category: Category.widow,
      monthlyIncome: 500,
      spouseDeceased: true,
      remarried: false,
      aadhaarNo: "671234509876",
      bankAccount: "TMBL0003456 / 70011223344",
      createdDaysAgo: 10,
      stage: Stage.stage1,
      status: Status.returned,
      events: [
        {
          daysAgo: 3,
          actorId: fv1.id,
          stage: Stage.stage1,
          action: EventAction.return_app,
          remarks:
            "கணவர் இறப்பு சான்றிதழ் இணைக்கப்படவில்லை. விண்ணப்பதாரரிடம் கேட்டு, சான்றிதழுடன் மீண்டும் சமர்ப்பிக்குமாறு அறிவிக்கப்பட்டது.",
        },
      ],
    },
    {
      applicantName: "செல்வி",
      age: 39,
      gender: "பெண்",
      address: "வடபழனி தெரு, சிவகங்கை வட்டம்",
      category: Category.widow,
      monthlyIncome: 0,
      spouseDeceased: true,
      remarried: false,
      aadhaarNo: "298765412309",
      bankAccount: "CNRB0004567 / 10055667788",
      createdDaysAgo: 1,
      stage: Stage.stage1,
      status: Status.in_progress,
      events: [],
    },
    {
      applicantName: "வெங்கடேசன்",
      age: 71,
      gender: "ஆண்",
      address: "புதூர் கிராமம், தஞ்சாவூர் வட்டம்",
      category: Category.old_age,
      monthlyIncome: 0,
      aadhaarNo: "384756129045",
      bankAccount: "SBIN0005678 / 30099887766",
      createdDaysAgo: 4,
      stage: Stage.stage2,
      status: Status.in_progress,
      events: [
        {
          daysAgo: 2,
          actorId: fv1.id,
          stage: Stage.stage1,
          action: EventAction.forward,
          remarks:
            "ஆதார், வயது சான்று ஆவணங்கள் சரிபார்க்கப்பட்டு, முழுமையாக உள்ளன. கள ஆய்வுக்கு அனுப்பப்படுகிறது.",
          aiAssisted: true,
          aiEdited: false,
        },
      ],
    },
    {
      applicantName: "கிருஷ்ணன்",
      age: 90,
      gender: "ஆண்",
      address: "அரியலூர் கிராமம், அரியலூர் வட்டம்",
      category: Category.old_age,
      monthlyIncome: 0,
      aadhaarNo: "756423190876",
      bankAccount: "IOBA0006789 / 60033445566",
      createdDaysAgo: 9,
      stage: Stage.stage2,
      status: Status.in_progress,
      events: [
        {
          daysAgo: 8,
          actorId: fv2.id,
          stage: Stage.stage1,
          action: EventAction.forward,
          remarks: "ஆவணங்கள் முழுமை. 90 வயது மூத்த குடிமகன். விரைவாக ஆய்வு செய்யப்பட வேண்டும்.",
        },
      ],
    },
    {
      applicantName: "மல்லிகா",
      age: 50,
      gender: "பெண்",
      address: "கரூர் கிராமம், கரூர் வட்டம்",
      category: Category.widow,
      monthlyIncome: 1200,
      spouseDeceased: true,
      remarried: false,
      aadhaarNo: "128374659021",
      bankAccount: "TMBL0007890 / 70022114455",
      createdDaysAgo: 12,
      stage: Stage.stage2,
      status: Status.returned,
      events: [
        {
          daysAgo: 10,
          actorId: fv2.id,
          stage: Stage.stage1,
          action: EventAction.forward,
          remarks: "ஆவணங்கள் சரிபார்க்கப்பட்டது. கள ஆய்வுக்கு அனுப்பப்படுகிறது.",
        },
        {
          daysAgo: 5,
          actorId: fv2.id,
          stage: Stage.stage2,
          action: EventAction.forward,
          remarks: "கள ஆய்வு முடிந்தது. இறுதி அனுமதிக்கு அனுப்பப்படுகிறது.",
        },
        {
          daysAgo: 2,
          actorId: ao1.id,
          stage: Stage.stage3,
          action: EventAction.return_app,
          remarks:
            "வருமான விவரத்தில் முரண்பாடு உள்ளது. மீண்டும் கள ஆய்வு செய்து, வருமான ஆதாரத்துடன் அனுப்பவும்.",
        },
      ],
    },
    {
      applicantName: "தங்கம்",
      age: 60,
      gender: "பெண்",
      address: "நாமக்கல் கிராமம், நாமக்கல் வட்டம்",
      category: Category.widow,
      monthlyIncome: 0,
      spouseDeceased: true,
      remarried: false,
      aadhaarNo: "903847561209",
      bankAccount: "CNRB0008901 / 10066778899",
      createdDaysAgo: 3,
      stage: Stage.stage2,
      status: Status.in_progress,
      events: [
        {
          daysAgo: 1,
          actorId: fv1.id,
          stage: Stage.stage1,
          action: EventAction.forward,
          remarks: "ஆவணங்கள் முழுமை. கள ஆய்வுக்கு அனுப்பப்படுகிறது.",
        },
      ],
    },
    {
      applicantName: "நடராஜன்",
      age: 65,
      gender: "ஆண்",
      address: "ஈரோடு கிராமம், ஈரோடு வட்டம்",
      category: Category.old_age,
      monthlyIncome: 0,
      aadhaarNo: "456781239045",
      bankAccount: "SBIN0009012 / 30077889900",
      createdDaysAgo: 5,
      stage: Stage.stage3,
      status: Status.in_progress,
      events: [
        {
          daysAgo: 4,
          actorId: fv1.id,
          stage: Stage.stage1,
          action: EventAction.forward,
          remarks: "ஆவணங்கள் சரிபார்க்கப்பட்டது.",
        },
        {
          daysAgo: 2,
          actorId: fv1.id,
          stage: Stage.stage2,
          action: EventAction.forward,
          remarks: "வீட்டு ஆய்வு முடிந்தது. தகுதியுடையவர். இறுதி அனுமதிக்கு அனுப்பப்படுகிறது.",
        },
      ],
    },
    {
      applicantName: "ஆண்டியப்பன்",
      age: 82,
      gender: "ஆண்",
      address: "விருதுநகர் கிராமம், விருதுநகர் வட்டம்",
      category: Category.old_age,
      monthlyIncome: 0,
      aadhaarNo: "167892345610",
      bankAccount: "IOBA0010123 / 60044556677",
      createdDaysAgo: 8,
      stage: Stage.stage3,
      status: Status.in_progress,
      events: [
        {
          daysAgo: 7,
          actorId: fv2.id,
          stage: Stage.stage1,
          action: EventAction.forward,
          remarks: "ஆவணங்கள் முழுமை.",
        },
        {
          daysAgo: 4,
          actorId: fv2.id,
          stage: Stage.stage2,
          action: EventAction.forward,
          remarks: "கள ஆய்வு முடிந்தது. 82 வயது. விரைவு கவனம் தேவை.",
        },
      ],
    },
    {
      applicantName: "பூங்கொடி",
      age: 55,
      gender: "பெண்",
      address: "திண்டுக்கல் கிராமம், திண்டுக்கல் வட்டம்",
      category: Category.widow,
      monthlyIncome: 800,
      spouseDeceased: true,
      remarried: false,
      aadhaarNo: "890123456721",
      bankAccount: "TMBL0011234 / 70088990011",
      createdDaysAgo: 2,
      stage: Stage.stage3,
      status: Status.in_progress,
      events: [
        {
          daysAgo: 2,
          actorId: fv1.id,
          stage: Stage.stage1,
          action: EventAction.forward,
          remarks: "ஆவணங்கள் சரிபார்க்கப்பட்டது.",
        },
        {
          daysAgo: 1,
          actorId: fv1.id,
          stage: Stage.stage2,
          action: EventAction.forward,
          remarks: "கள ஆய்வு முடிந்தது. தகுதியுடையவர்.",
        },
      ],
    },
    {
      applicantName: "சரோஜா",
      age: 70,
      gender: "பெண்",
      address: "சேலம் கிராமம், சேலம் வட்டம்",
      category: Category.old_age,
      monthlyIncome: 0,
      aadhaarNo: "345612789034",
      bankAccount: "SBIN0012345 / 30066554433",
      createdDaysAgo: 20,
      stage: Stage.stage3,
      status: Status.approved,
      events: [
        {
          daysAgo: 18,
          actorId: fv2.id,
          stage: Stage.stage1,
          action: EventAction.forward,
          remarks: "ஆவணங்கள் முழுமை.",
        },
        {
          daysAgo: 15,
          actorId: fv2.id,
          stage: Stage.stage2,
          action: EventAction.forward,
          remarks: "கள ஆய்வு முடிந்தது. தகுதியுடையவர்.",
        },
        {
          daysAgo: 12,
          actorId: ao2.id,
          stage: Stage.stage3,
          action: EventAction.approve,
          remarks:
            "அனைத்து ஆவணங்களும் சரிபார்க்கப்பட்டு, தகுதி உறுதி செய்யப்பட்டது. முதுமை ஓய்வூதியம் அனுமதிக்கப்படுகிறது.",
          aiAssisted: true,
          aiEdited: true,
        },
      ],
    },
    {
      applicantName: "சுப்பிரமணி",
      age: 58,
      gender: "ஆண்",
      address: "கோயம்புத்தூர் கிராமம், கோயம்புத்தூர் வட்டம்",
      category: Category.old_age,
      monthlyIncome: 15000,
      aadhaarNo: "612349875023",
      bankAccount: "CNRB0013456 / 10099001122",
      createdDaysAgo: 15,
      stage: Stage.stage2,
      status: Status.rejected,
      events: [
        {
          daysAgo: 14,
          actorId: fv1.id,
          stage: Stage.stage1,
          action: EventAction.forward,
          remarks: "ஆவணங்கள் முழுமை. கள ஆய்வுக்கு அனுப்பப்படுகிறது.",
        },
        {
          daysAgo: 11,
          actorId: fv1.id,
          stage: Stage.stage2,
          action: EventAction.reject,
          remarks:
            "வயது 58 (தகுதி வயது 60 க்கு குறைவு) மற்றும் மாத வருமானம் வரம்புக்கு மேல். தகுதியற்றவர்.",
        },
      ],
    },
  ];

  for (const s of seeds) {
    const app = await db.application.create({
      data: {
        applicantName: s.applicantName,
        age: s.age,
        dob: yearsAgo(s.age),
        gender: s.gender,
        address: s.address,
        category: s.category,
        monthlyIncome: s.monthlyIncome,
        spouseDeceased: s.spouseDeceased ?? null,
        remarried: s.remarried ?? null,
        aadhaarNo: s.aadhaarNo,
        bankAccount: s.bankAccount,
        stage: s.stage,
        status: s.status,
        createdAt: daysAgo(s.createdDaysAgo),
      },
    });

    for (const e of s.events) {
      await db.applicationEvent.create({
        data: {
          applicationId: app.id,
          actorId: e.actorId,
          stage: e.stage,
          action: e.action,
          remarks: e.remarks,
          aiAssisted: e.aiAssisted ?? false,
          aiEdited: e.aiEdited ?? null,
          createdAt: daysAgo(e.daysAgo),
        },
      });
    }
  }

  console.log(`Seeded ${seeds.length} applications and 4 staff accounts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
