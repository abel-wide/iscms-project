import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import AdminOverview from './pages/admin/AdminOverview';
import ManageUsers from './pages/admin/ManageUsers';
import ManageClasses from './pages/admin/ManageClasses';
import Reports from './pages/admin/Reports';
import Payments from './pages/admin/Payments';
import Announcements from './pages/admin/Announcements';
import Settings from './pages/admin/Settings';
import StudentsList from './pages/admin/StudentsList';
import StudentProfile from './pages/admin/StudentProfile';
import TeachersList from './pages/admin/TeachersList';
import TeacherProfile from './pages/admin/TeacherProfile';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherOverview from './pages/teacher/TeacherOverview';
import MarkAttendance from './pages/teacher/MarkAttendance';
import AttendanceReport from './pages/admin/AttendanceReport';
import EnterGrades from './pages/teacher/EnterGrades';
import UploadResources from './pages/teacher/UploadResources';
import ClassAnnouncements from './pages/teacher/ClassAnnouncements';
import StudentDashboard from './pages/StudentDashboard';
import StudentOverview from './pages/student/StudentOverview';
import MyGrades from './pages/student/MyGrades';
import MyAttendance from './pages/student/MyAttendance';
import LearningHub from './pages/student/LearningHub';
import MyNotifications from './pages/student/MyNotifications';
import RegistrarDashboard from './pages/RegistrarDashboard';
import RegistrarOverview from './pages/registrar/RegistrarOverview';
import StudentApprovals from './pages/registrar/StudentApprovals';
import AcademicRules from './pages/registrar/AcademicRules';
import RegistrarReports from './pages/registrar/RegistrarReports';
import ParentDashboard from './pages/ParentDashboard';
import ParentOverview from './pages/parent/ParentOverview';
import ChildGrades from './pages/parent/ChildGrades';
import ChildAttendance from './pages/parent/ChildAttendance';
import MakePayment from './pages/parent/MakePayment';
import PaymentHistory from './pages/parent/PaymentHistory';
import PaymentCallback from './pages/parent/PaymentCallback';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="classes" element={<ManageClasses />} />
            <Route path="reports" element={<Reports />} />
            <Route path="payments" element={<Payments />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="settings" element={<Settings />} />
            <Route path="students" element={<StudentsList />} />
            <Route path="/admin/students/:id" element={<StudentProfile />} />
            <Route path="teachers" element={<TeachersList />} />
            <Route path="teachers/:id" element={<TeacherProfile />} />
            <Route path="attendance" element={<AttendanceReport />} />
          </Route>

          {/* Teacher routes */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<TeacherOverview />} />
            <Route path="attendance" element={<MarkAttendance />} />
            <Route path="grades" element={<EnterGrades />} />
            <Route path="resources" element={<UploadResources />} />
            <Route path="announcements" element={<ClassAnnouncements />} />
          </Route>

          {/* Student routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentOverview />} />
            <Route path="grades" element={<MyGrades />} />
            <Route path="attendance" element={<MyAttendance />} />
            <Route path="resources" element={<LearningHub />} />
            <Route path="notifications" element={<MyNotifications />} />
          </Route>

          {/* Registrar routes */}
          <Route
            path="/registrar"
            element={
              <ProtectedRoute allowedRoles={['registrar']}>
                <RegistrarDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<RegistrarOverview />} />
            <Route path="approvals" element={<StudentApprovals />} />
            <Route path="rules" element={<AcademicRules />} />
            <Route path="reports" element={<RegistrarReports />} />
            <Route path="users" element={<StudentApprovals />} />
          </Route>

          {/* Parent routes */}
          <Route
            path="/parent"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<ParentOverview />} />
            <Route path="grades" element={<ChildGrades />} />
            <Route path="attendance" element={<ChildAttendance />} />
            <Route path="payments" element={<MakePayment />} />
            <Route path="history" element={<PaymentHistory />} />
          </Route>
          
          {/* Payment Callback Route */}
          <Route path="/payment/callback" element={<PaymentCallback />} />
          <Route path="/payment/success" element={<PaymentCallback />} />

          <Route path="/" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}