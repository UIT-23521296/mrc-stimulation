let wrrIndex = 0;
let expandedList = [];

function expandRelaysByWeight(relays) {
  const list = [];
  for (const r of relays) {
    if (!r.healthy) continue;
    const w = r.weight || 1;
    for (let i = 0; i < w; i++) list.push(r);
  }
  return list;
}

function selectRelay_WeightedRoundRobin(relays) {
  expandedList = expandRelaysByWeight(relays);
  if (!expandedList.length) throw new Error("❌ No healthy relay available.");
  
  const selected = expandedList[wrrIndex % expandedList.length];
  wrrIndex = (wrrIndex + 1) % expandedList.length;
  return selected;
}

module.exports = { selectRelay_WeightedRoundRobin };
