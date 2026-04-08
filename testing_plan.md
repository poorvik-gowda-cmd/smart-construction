# Comprehensive Testing Plan: SiteMaster Platform

This plan outlines every step required to verify that the SiteMaster platform is production-ready, synchronized with the new database, and secure across all user roles.

---

## 1. Environment & Setup Checklist
Before testing, ensure the following are confirmed:
- [ ] **Database Refresh**: Master Overhaul SQL script has been run in Supabase.
- [ ] **Storage Check**: `site-updates`, `documents`, and `safety-reports` buckets exist and are marked "Public".
- [ ] **Environment**: `.env.local` contains valid Supabase and OpenAI keys.
- [ ] **Status**: `npm run dev` is running or Vercel deployment is active.

---

## 2. Authentication & Onboarding
| Test ID | Feature | Action | Expected Result |
| :--- | :--- | :--- | :--- |
| AUTH-01 | **Admin Signup** | Sign up via `/` role selector with `admin` role. | Redirects to Admin Dashboard; `profiles` table automatically creates entry. |
| AUTH-02 | **Engineer Login** | Log in using the **Company ID** flow (e.g., `SITE-2026-X`). | Redirects to Engineer Dashboard; bypasses standard password if configured. |
| AUTH-03 | **Client Signup** | Sign up as `client`. | Redirects to a "Pending Assignment" state or Client Portal. |
| AUTH-04 | **RBAC Security** | Log in as `client` and try to manually navigate to `/dashboard/admin/users`. | Should redirect back to dashboard or show 403/Unauthorized. |

---

## 3. Project & Personnel Management
| Test ID | Feature | Action | Expected Result |
| :--- | :--- | :--- | :--- |
| PM-01 | **Project List** | View `/dashboard/projects`. | Verify that "Skyline Apartments" and others from mock data appear with correct stats. |
| PM-02 | **Labor Directory**| View `/dashboard/labor`. | Verify "Manoj Das" and others appear with correct skill tags and rates. |
| PM-03 | **Attendance Log** | Go to `/dashboard/attendance`, select a date, and mark a worker as "Present". | Status updates in UI; `attendance` table in Supabase reflects change. |
| PM-04 | **Overtime Calc** | Mark a worker as "Overtime" and add 4 hours. | Projected pay column should correctly calculate `Daily Rate + (OT * 1.5)`. |

---

## 4. Operational Flows
| Test ID | Feature | Action | Expected Result |
| :--- | :--- | :--- | :--- |
| OPS-01 | **Expense Entry** | Log a new "Material" expense of ₹50,000. | Chart on main dashboard should update to reflect the new spending category. |
| OPS-02 | **Material Stock**| View `/dashboard/materials`. | Verify reorder points; items with stock below reorder level should show "Low Stock" alerts. |
| OPS-03 | **Supplier List** | Add a new supplier "Eco-Steel". | Item appears in the Supplier Network list with correct Material Tags. |

---

## 5. Site Logging & Geo-Tagging (The Map)
| Test ID | Feature | Action | Expected Result |
| :--- | :--- | :--- | :--- |
| MAP-01 | **Map Markers** | Open the Project Map/Updates page. | Verify pins appear at the specific Lat/Long provided in mock data. |
| MAP-02 | **Update Upload**| Upload a photo to a site update. | Photo appears in the timeline; file is successfully stored in the `site-updates` bucket. |
| MAP-03 | **Geo-Isolation**| Log in as Client A and check maps for Project B. | Client should ONLY see map markers and updates for the project they are assigned to. |

---

## 6. Feedback & Safety
| Test ID | Feature | Action | Expected Result |
| :--- | :--- | :--- | :--- |
| SAF-01 | **Hazard Log** | Log a "Critical" safety issue "Loose Cables". | Admin/Engineer receives high-visibility alert; issue appears on the safety map. |
| CMP-01 | **Complaint** | As a Client, submit a complaint about "Delivery Delays". | Complaint appears in the `/dashboard/complaints` list for both Client and Admin. |
| DOC-01 | **Documents** | Navigate to Project Documents. | Verify mock documents (Blueprints, Reports) are downloadable via public links. |

---

## 7. AI Risk Analytics
| Test ID | Feature | Action | Expected Result |
| :--- | :--- | :--- | :--- |
| AI-01 | **Insight Gen** | View the Dashboard "AI Risk Assessment". | AI should analyze current Attendance (High/Low) and Budget (On/Over) to give a text-based risk score. |
| AI-02 | **Real-time Sync**| Dramatically increase expenses for a project. | The next AI generation should reflect "High Budget Risk" in its analysis. |

---

## 8. Final Export & Reporting
| Test ID | Feature | Action | Expected Result |
| :--- | :--- | :--- | :--- |
| REP-01 | **PDF Export** | Click "Export Log" in the Attendance or Expenses page. | A downloadable report is generated (if PDF logic is fully implemented) or CSV download occurs. |

---

> [!IMPORTANT]
> **Production Readiness**: If all 25+ tests above pass, the platform is ready for client onboarding.
