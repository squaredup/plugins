// cgi-boost-time-{key} returns every slot the device has, configured or not, as
// { boost_times: [{ slt, bsh, bsm, bdh, bdm, bdd }] }. An unset slot has an all-zero
// day mask, so a slot only counts as a schedule when at least one day is set.
// bdd is eight characters: a constant leading 0, then Monday to Sunday.
const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const pad = (n) => String(n ?? 0).padStart(2, "0");

const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const object = context.objects[0];
const deviceKey = unwrap(object.rawId);
const deviceName = unwrap(object.name);
const deviceType = deviceKey.startsWith("Z") ? "Zappi" : "Eddi";

// The slot numbering for an Eddi is not documented (see the slot tens digit: 1, 2, 5, 6
// all appear, with zero durations), so an Eddi slot gets a neutral output label
// derived from the tens digit rather than a guessed heater or relay name.
const targetFor = (slot) =>
    deviceType === "Zappi" ? "EV" : `Output ${Math.floor(slot / 10)}`;

const slots = Array.isArray(data?.boost_times) ? data.boost_times : [];

result = slots
    .map((s) => {
        const mask = String(s.bdd ?? "").padStart(8, "0");
        const days = dayNames.filter((_, i) => mask[i + 1] === "1");
        // A duration of 0 is reported for Eddi slots and means "no fixed length",
        // not zero minutes, so it is returned as blank.
        const minutes = (s.bdh ?? 0) * 60 + (s.bdm ?? 0);
        return {
            deviceName,
            deviceKey,
            deviceType,
            slot: s.slt,
            target: targetFor(s.slt),
            startTime: `${pad(s.bsh)}:${pad(s.bsm)}`,
            duration: minutes > 0 ? minutes : null,
            days,
        };
    })
    .filter((row) => row.days.length > 0);
