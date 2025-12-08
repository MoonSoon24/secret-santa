export function drawNames(participants) {
  // Deep copy to avoid mutating original state
  const pool = [...participants];
  let valid = false;
  let attempts = 0;
  let shuffled;

  // Retry loop to prevent dead-ends
  while (!valid && attempts < 1000) {
    attempts++;
    shuffled = [...pool].sort(() => Math.random() - 0.5);
    
    valid = pool.every((p, i) => {
      const target = shuffled[i];
      
      // Constraint 1: Can't pick self
      if (p.user_id === target.user_id) return false;
      
      // Constraint 2: Exclusion Groups (Sub-groups that CANNOT match)
      // e.g. Couples who shouldn't buy for each other
      if (p.group_id && target.group_id && p.group_id === target.group_id) {
          return false;
      }

      // Constraint 3: Strict Pools (Inclusion Groups)
      // e.g. "Kids Table" - can ONLY buy for other kids
      if (p.strict_pool_id && p.strict_pool_id !== target.strict_pool_id) return false;
      if (target.strict_pool_id && target.strict_pool_id !== p.strict_pool_id) return false;

      // Constraint 4: Direct Exclusions
      // e.g. "I cannot draw Bob"
      if (p.exclusions && Array.isArray(p.exclusions) && p.exclusions.includes(target.user_id)) {
        return false;
      }
      
      return true;
    });
  }

  if (!valid) throw new Error("Could not generate a valid match. Constraints are too tight! Try removing some exclusions.");

  // Return mapped updates
  return pool.map((p, i) => ({
    row_id: p.id, // The ID of the participation row
    target_id: shuffled[i].user_id
  }));
}