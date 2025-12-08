export function drawNames(participants) {
  // Deep copy to avoid mutating original state
  const pool = [...participants];
  let valid = false;
  let attempts = 0;
  let shuffled;

  // Retry loop to prevent dead-ends
  while (!valid && attempts < 500) {
    attempts++;
    shuffled = [...pool].sort(() => Math.random() - 0.5);
    
    valid = pool.every((p, i) => {
      const target = shuffled[i];
      
      // Constraint 1: Can't pick self
      if (p.user_id === target.user_id) return false;
      
      // Constraint 2: Groups (e.g., Couples)
      if (p.group_id && target.group_id && p.group_id === target.group_id) return false;
      
      return true;
    });
  }

  if (!valid) throw new Error("Could not generate a valid match. Constraints are too tight!");

  // Return mapped updates
  return pool.map((p, i) => ({
    row_id: p.id, // The ID of the participation row
    target_id: shuffled[i].user_id
  }));
}