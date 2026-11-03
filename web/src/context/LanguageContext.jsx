/* eslint-disable react-refresh/only-export-components*/ 
import { createContext, useState } from 'react';

const translations = {
  en: {
    // Dashboard Menu
    dashboard: "Dashboard",
    manageUsers: "Manage Users",
    manageClasses: "Manage Classes",
    reports: "Reports",
    payments: "Payments",
    announcements: "Announcements",
    settings: "Settings",
    logout: "Logout",
    
    // Generic Words
    students: "Students",
    teachers: "Teachers",
    classes: "Classes",
    viewDetails: "View Details",
    name: "Name",
    email: "Email",
    class: "Class",
    status: "Status",
    action: "Action",
    active: "Active",
    notAssigned: "Not Assigned",
    notRecorded: "Not Recorded",
    loading: "Loading...",
    backToList: "Back to List",
    joined: "Joined",
    phone: "Phone",
    role: "Role",
    
    // Specific Pages
    studentsList: "Students List",
    teachersList: "Teachers List",
    studentProfile: "Student Profile",
    teacherProfile: "Teacher Profile",
    backToStudents: "Back to Students",
    backToTeachers: "Back to Teachers",
    myAttendance: "My Attendance",
    attendanceHistory: "Attendance History",
    total: "Total",
    present: "Present",
    absent: "Absent",
    late: "Late",
    excused: "Excused",
    date: "Date",
    day: "Day",
    details: "Details",
    noAttendanceRecords: "No attendance records found.",
    attendanceDetails: "Attendance Details",
    remarks: "Remarks",
    noRemarks: "No specific remarks.",
    close: "Close",
    showAll: "Show All",

    newClass: "New Class",
    className: "Class Name",
    gradeLevel: "Grade Level",
    section: "Section",
    academicYear: "Academic Year",
    capacity: "Capacity",
    createClass: "Create Class",
    teacher: "Teacher",
    delete: "Delete",
    assignTeacher: "Assign Teacher",
    selectTeacher: "Select Teacher",
    searchTeacher: "Search teacher by name or email...",
    noTeachersFound: "No teachers found.",
    assign: "Assign",
    cancel: "Cancel",
    studentsIn: "Students in",
    enrolledStudents: "Enrolled Students",
    noStudentsEnrolled: "No students enrolled yet.",
    addStudent: "Add Student",
    selectStudent: "Select Student",
    searchStudent: "Search student by name or email...",
    noStudentsFound: "No students found.",
    remove: "Remove",
    homeroomTeacher: "HOMEROOM TEACHER",
    assigned: "Assigned",

    // Messages
    successClassCreated: "Class created successfully",
    errorClassCreate: "Failed to create class",
    successTeacherAssigned: "Teacher assigned successfully",
    errorSelectTeacher: "Please select a teacher",
    errorAssignment: "Assignment failed",
    successStudentAdded: "Student added successfully",
    errorSelectStudent: "Please select a student",
    errorAddStudent: "Failed to add student",
    successStudentRemoved: "Student removed",
    errorRemoveStudent: "Failed to remove student",
    successClassDeleted: "Class deleted",
    errorDeleteClass: "Delete failed",
    confirmRemoveStudent: "Remove this student from the class?",
    confirmDeleteClass: "Delete this class? This cannot be undone.",
    welcomeBack: "Welcome back",
  },
  am: {
    // Dashboard Menu
    dashboard: "ዳሽቦርድ",
    manageUsers: "ተጠቃሚዎችን ያስተዳድሩ",
    manageClasses: "ክፍሎችን ያስተዳድሩ",
    reports: "ሪፖርቶች",
    payments: "ክፍያዎች",
    announcements: "ማስታወቂያዎች",
    settings: "ቅንብሮች",
    logout: "ውጣ",
    
    // Generic Words
    students: "ተማሪዎች",
    teachers: "መምህራን",
    classes: "ክፍሎች",
    viewDetails: "ዝርዝር ይመልከቱ",
    name: "ስም",
    email: "ኢሜይል",
    class: "ክፍል",
    status: "ሁኔታ",
    action: "ተግባር",
    active: "ንቁ",
    notAssigned: "አልተመደበም",
    notRecorded: "አልተመዘገበም",
    loading: "በመጫን ላይ...",
    backToList: "ወደ ዝርዝር ተመለስ",
    joined: "የተቀጠረበት/የተመዘገበበት ቀን",
    phone: "ስልክ ቁጥር",
    role: "ሮል",
    
    // Specific Pages
    studentsList: "የተማሪዎች ዝርዝር",
    teachersList: "የመምህራን ዝርዝር",
    studentProfile: "የተማሪ መገለጫ",
    teacherProfile: "የመምህር መገለጫ",
    backToStudents: "ወደ ተማሪዎች ተመለስ",
    backToTeachers: "ወደ መምህራን ተመለስ",
    myAttendance: "የእኔ ክትትል",
    attendanceHistory: "የክትትል ታሪክ",
    total: "ጠቅላላ",
    present: "ተገኝ",
    absent: "አልተገኘም",
    late: "ዘግይቷል",
    excused: "ፈቃድ ያለው",
    date: "ቀን",
    day: "ቀን (የሳምንቱ)",
    details: "ዝርዝር",
    noAttendanceRecords: "ምንም የክትትል መዝገብ አልተገኘም።",
    attendanceDetails: "የክትትል ዝርዝር",
    remarks: "አስተያየት",
    noRemarks: "ምንም አስተያየት የለም።",
    showAll: "ሁሉንም አሳይ",

    newClass: "አዲስ ክፍል",
    className: "የክፍሉ ስም",
    gradeLevel: "የክፍል ደረጃ",
    section: "ክፍል (Section)",
    academicYear: "የትምህርት ዓመት",
    capacity: "አቅም",
    createClass: "ክፍል ፍጠር",
    teacher: "መምህር",
    delete: "ሰርዝ",
    assignTeacher: "መምህር መድብ",
    selectTeacher: "መምህር ይምረጡ",
    searchTeacher: "መምህር በስም ወይም በኢሜይል ይፈልጉ...",
    noTeachersFound: "ምንም መምህር አልተገኘም።",
    assign: "መድብ",
    cancel: "ሰርዝ",
    studentsIn: "ተማሪዎች በ",
    enrolledStudents: "የተመዘገቡ ተማሪዎች",
    noStudentsEnrolled: "እስካሁን ምንም ተማሪ አልተመዘገበም።",
    addStudent: "ተማሪ ጨምር",
    selectStudent: "ተማሪ ይምረጡ",
    searchStudent: "ተማሪ በስም ወይም በኢሜይል ይፈልጉ...",
    noStudentsFound: "ምንም ተማሪ አልተገኘም።",
    remove: "አስወግድ",
    close: "ዝጋ",
    homeroomTeacher: "የክፍል መምህር",
    assigned: "ተመድቧል",
    // Messages
    successClassCreated: "ክፍሉ በተሳካ ሁኔታ ተፈጥሯል",
    errorClassCreate: "ክፍል መፍጠር አልተቻለም",
    successTeacherAssigned: "መምህር በተሳካ ሁኔታ ተመድቧል",
    errorSelectTeacher: "እባክዎ መምህር ይምረጡ",
    errorAssignment: "ምዝገባ አልተሳካም",
    successStudentAdded: "ተማሪ በተሳካ ሁኔታ ተጨምሯል",
    errorSelectStudent: "እባክዎ ተማሪ ይምረጡ",
    errorAddStudent: "ተማሪ መጨመር አልተቻለም",
    successStudentRemoved: "ተማሪው ተወግዷል",
    errorRemoveStudent: "ተማሪ ማስወገድ አልተቻለም",
    successClassDeleted: "ክፍሉ ተሰርዟል",
    errorDeleteClass: "መሰረዝ አልተሳካም",
    confirmRemoveStudent: "ይህን ተማሪ ከክፍሉ ማስወገድ ይፈልጋሉ?",
    confirmDeleteClass: "ይህን ክፍል መሰረዝ ይፈልጋሉ? ይህ ተግባር መመለስ አይቻልም።",
    welcomeBack: "እንኳን ደህና መጡ",
  }
};

export const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en'); // ነባሪ (Default) እንግሊዝኛ

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'am' : 'en'));
  };

  // ቃላቱን በቀላሉ ለመጥራት የሚያገለግል function (t = translate)
  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}