//App.jsx
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import Home from './pages/Home';
import MyFlipbooks from './pages/MyFlipbooks';
import SettingsLayout from './pages/Settings/Profile/Settings';
import Profile from './pages/Settings/Profile/Profile';
import Account from './pages/Settings/Account';
import Notifications from './pages/Settings/Notifications';
import MyShelf from './pages/Settings/MyShelf';
import EditorDefaults from './pages/Settings/EditorDefaults';
import Library from './pages/Settings/Library';
import Integrations from './pages/Settings/Integrations';
import PrivacyAccess from './pages/Settings/PrivacyAccess';
import Analytics from './pages/Settings/Analytics';
import Billing from './pages/Settings/Billing';
import Advanced from './pages/Settings/Advanced';
import AccountManagement from './pages/Settings/AccountManagement';
import About from './pages/About';
import Explore from './pages/Explore';
import Template from './pages/Template';
import ContactUs from './pages/ContactUs';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import Editor from './Modules/Editer';
import { MainEditor } from './components/TemplateEditor'; // Import MainEditor
import PreviewPage from './pages/PreviewPage';
import ARView from './pages/ARView';
import ThreedEditor from './components/ThreedEditor/ThreedEditor';
import CustomizedEditor from './components/CustomizedEditor/CustomizedEditor';
import ShareViewBook from './pages/shareviewbook';
import Viewprofile from './pages/Viewprofile';
import { ToastProvider } from './components/CustomToast';
import { ModernToastProvider } from './components/ModernToast';
import ProtectedRoute from './components/ProtectedRoute';
import NetworkStatus from './pages/NetworkStatus';

function SettingsIndexRedirect() {
  let email = '';
  try {
    const stored = localStorage.getItem('user_profile') || localStorage.getItem('user');
    if (stored) {
      const u = JSON.parse(stored);
      email = u.emailId || u.email || '';
    }
  } catch (e) {}

  if (email) {
    return <Navigate to={`profile/${encodeURIComponent(email)}`} replace />;
  }
  return <Navigate to="profile" replace />;
}

function App() {
  return (
    <ToastProvider>
      <ModernToastProvider>
        <Router>
          <NetworkStatus />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Signin />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/share=public/:shareId" element={<ShareViewBook />} />
            <Route path="/share=private/:shareId" element={<ShareViewBook />} />
            <Route path="/share=password/:shareId" element={<ShareViewBook />} />
            <Route path="/share=invite/:shareId" element={<ShareViewBook />} />
            <Route path="/share/:shareId" element={<ShareViewBook />} />
            <Route path="/preview" element={<ProtectedRoute><PreviewPage /></ProtectedRoute>} />
            <Route path="/ar-view" element={<ARView />} />

            {/* Protected Editor Layout */}
            <Route path="/editor" element={
              <ProtectedRoute>
                <Editor />
              </ProtectedRoute>
            }>
              <Route index element={<MainEditor />} />
              <Route path="threed_editor" element={<ThreedEditor />} />
              <Route path="threed_editor/:modelId" element={<ThreedEditor />} />
              <Route path="customized_editor" element={<CustomizedEditor />} />
              <Route path="customized_editor/:v_id" element={<CustomizedEditor />} />
              <Route path="customized_editor/:folder/:v_id" element={<CustomizedEditor />} />
              <Route path="customized_editor/:folder/:v_id/:page" element={<CustomizedEditor />} />
              <Route path=":folder/:v_id" element={<MainEditor />} />
              <Route path=":v_id" element={<MainEditor />} />
            </Route>

            {/* Protected Routes WITH navbar */}
            <Route element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route path="/home" element={<Home />} />
              <Route path="/my-flipbooks" element={<MyFlipbooks />} />
              <Route path="/templates" element={<Template />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/profile/:useremail" element={<Viewprofile />} />
              <Route path="/profile" element={<Viewprofile />} />
              <Route path="/settings" element={<SettingsLayout />}>
                <Route index element={<SettingsIndexRedirect />} />
                <Route path="profile" element={<Profile />} />
                <Route path="profile/:useremail" element={<Profile />} />
                <Route path="account" element={<Account />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="my-shelf" element={<MyShelf />} />
                <Route path="editor-defaults" element={<EditorDefaults />} />
                <Route path="library" element={<Library />} />
                <Route path="integrations" element={<Integrations />} />
                <Route path="privacy-access" element={<PrivacyAccess />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="billing" element={<Billing />} />
                <Route path="advanced" element={<Advanced />} />
                <Route path="account-management" element={<AccountManagement />} />
              </Route>
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<ContactUs />} />
            </Route>

            {/* Catch-all route for wrong URLs */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ModernToastProvider>
    </ToastProvider>
  );
}

export default App;