export function calculateAge(dobString: string | Date): string {
  const dob = new Date(dobString);
  const now = new Date();
  
  if (isNaN(dob.getTime())) return 'Unknown age';

  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  
  if (months < 0 || (months === 0 && now.getDate() < dob.getDate())) {
    years--;
    months += 12;
  }
  
  if (years > 0) {
    return `${years} year${years !== 1 ? 's' : ''}${months > 0 ? ` ${months} mo` : ''}`;
  }
  
  if (months > 0) {
    return `${months} month${months !== 1 ? 's' : ''}`;
  }
  
  return 'Less than a month';
}
