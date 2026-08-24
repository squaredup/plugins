// GET users/me/profile returns a single, sparse Profile object, e.g.
// { name: "users/{id}/profile", age, membershipStartDate: {year,month,day},
//   userConfiguredWalkingStrideLengthMm, userConfiguredRunningStrideLengthMm,
//   autoRunningStrideLengthMm }
const p = data || {};

const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};

const userId = typeof p.name === "string" ? p.name.split("/")[1] : p.userId || p.id;

// membershipStartDate is a civil date {year, month, day}.
let memberSince;
let membershipYears;
const m = p.membershipStartDate;
if (m && m.year) {
    memberSince = new Date(Date.UTC(m.year, (m.month || 1) - 1, m.day || 1));
    membershipYears =
        Math.round(((Date.now() - memberSince.getTime()) / (365.25 * 24 * 3600 * 1000)) * 10) / 10;
}

const mmToCm = (v) => {
    const n = num(v);
    return n === undefined ? undefined : Math.round(n / 10 * 10) / 10;
};

result = [
    {
        userId: userId,
        displayName: "Me",
        age: num(p.age),
        memberSince: memberSince,
        membershipYears: membershipYears,
        walkingStrideCm: mmToCm(p.userConfiguredWalkingStrideLengthMm ?? p.autoWalkingStrideLengthMm),
        runningStrideCm: mmToCm(p.userConfiguredRunningStrideLengthMm ?? p.autoRunningStrideLengthMm),
    },
];
