/**
 * JNTU / Alphanumeric Roll Number Rank Calculator & Comparator
 * Enforces strict JNTU roll number ordering:
 * 1. Batch / Department Prefix (22N81A05...)
 * 2. Numeric Suffixes (01..99)
 * 3. Alphanumeric Suffixes (A0..A9, B0..B9, ..., Z0..Z9)
 * 4. Next Batch (23N81A05...)
 */
export const getJntuRank = (s) => {
  const str = (typeof s === "object" ? (s?.enrollmentNo || s?.enrollment || s?.rollNo || s?.loginid || "") : (s || "")).toString().trim().toUpperCase();
  if (!str) return { prefix: "", rank: 0 };
  if (str.length < 3) return { prefix: str, rank: 0 };

  const prefix = str.substring(0, str.length - 2);
  const suff = str.substring(str.length - 2);

  // Pure 2-digit numeric suffix (01..99)
  if (/^\d{2}$/.test(suff)) {
    return { prefix, rank: parseInt(suff, 10) };
  }

  // Alphanumeric suffix (A0..Z9)
  if (/^[A-Z]\d$/.test(suff)) {
    const charCode = suff.charCodeAt(0) - 65; // A=0, B=1...
    const digit = parseInt(suff[1], 10);
    return { prefix, rank: 100 + charCode * 10 + digit };
  }

  // Fallback for non-standard suffixes
  return { prefix, rank: 9999 };
};

export const sortEnrollmentNo = (a, b) => {
  const rA = getJntuRank(a);
  const rB = getJntuRank(b);

  if (rA.prefix !== rB.prefix) {
    return rA.prefix.localeCompare(rB.prefix, undefined, { numeric: true, sensitivity: "base" });
  }

  return rA.rank - rB.rank;
};

export default sortEnrollmentNo;
