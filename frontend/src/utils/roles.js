export const ROLES = {
  ADMIN: "admin",
  DOCTOR: "doctor",
  NURSE: "nurse",
  SECRETARY: "secretary",
  STAFF: "staff",
  PARENT: "parent",
};

export const STAFF_ROLES = [
  ROLES.ADMIN,
  ROLES.DOCTOR,
  ROLES.NURSE,
  ROLES.SECRETARY,
  ROLES.STAFF,
];

export const MEDICAL_ROLES = [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE];
export const FRONT_DESK_ROLES = [ROLES.ADMIN, ROLES.SECRETARY, ROLES.STAFF, ROLES.NURSE];
export const ADMIN_ONLY = [ROLES.ADMIN];
