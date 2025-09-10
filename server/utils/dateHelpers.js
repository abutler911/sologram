// server/utils/dateHelpers.js
function noonUTCFromInputDateStr(isoDateStr /* 'YYYY-MM-DD' */) {
  if (!isoDateStr) return null;
  const [y, m, d] = isoDateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0)); // 12:00 UTC
}

function todayNoonUTC() {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      12,
      0,
      0,
      0
    )
  );
}

module.exports = { noonUTCFromInputDateStr, todayNoonUTC };
