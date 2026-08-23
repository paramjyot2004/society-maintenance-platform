import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  PlusCircle, 
  Wrench, 
  ShieldCheck, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowUpDown, 
  Layers,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import { 
  Complaint, 
  StaffMember, 
  Notice, 
  MaintenanceBill, 
  SocietyUnit, 
  CurrentUser, 
  UserRole,
  ComplaintStatus,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatusHistory,
  CreateNoticeInput,
  UpdateNoticeInput
} from './types';
import { 
  CURRENT_USERS, 
  STAFF_MEMBERS, 
  INITIAL_COMPLAINTS, 
  INITIAL_NOTICES, 
  INITIAL_BILLS, 
  SOCIETY_UNITS 
} from './data/mockData';
import { Navbar } from './components/Navbar';
import { StatsOverview } from './components/StatsOverview';
import { ComplaintCard } from './components/ComplaintCard';
import { ComplaintDetailsModal } from './components/ComplaintDetailsModal';
import { NewComplaintModal } from './components/NewComplaintModal';
import { NoticesBoard } from './components/NoticesBoard';
import { DuesAndBilling } from './components/DuesAndBilling';
import { UnitsDirectory } from './components/UnitsDirectory';
import { StaffRoster } from './components/StaffRoster';
import { AdminComplaintManagement } from './components/AdminComplaintManagement';
import { AdminDashboard } from './components/AdminDashboard';
import { ResidentComplaintsView } from './components/ResidentComplaintsView';
import { AuthModal } from './components/AuthModal';
import { LoginPage } from './components/LoginPage';
import { 
  fetchCurrentSessionUser, 
  logoutUser, 
  getStoredToken 
} from './services/authService';
import { createResidentComplaint } from './services/complaintService';
import { 
  createNotice, 
  updateNotice, 
  deleteNotice, 
  toggleNoticeImportance,
  fetchNoticesFromServer,
  createNoticeOnServer,
  updateNoticeOnServer,
  deleteNoticeOnServer
} from './services/noticeService';
import { 
  sendComplaintStatusEmailNotification, 
  sendImportantNoticeEmailNotification 
} from './services/emailService';

export default function App() {
  // Current active user / role
  const [currentRole, setCurrentRole] = useState<UserRole>('RESIDENT');
  const [currentUser, setCurrentUser] = useState<CurrentUser>(CURRENT_USERS.RESIDENT);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Check existing session on mount and sync server notices
  useEffect(() => {
    async function verifyInitialSession() {
      const token = getStoredToken();
      if (token) {
        const sessionUser = await fetchCurrentSessionUser();
        if (sessionUser) {
          setCurrentUser(sessionUser);
          setCurrentRole(sessionUser.role);
          setIsAuthenticated(true);
        }
      }
    }
    verifyInitialSession();

    // Fetch notices from server (Important pinned on top)
    fetchNoticesFromServer().then(res => {
      if (res.success && res.data && res.data.length > 0) {
        setNotices(res.data);
      }
    }).catch(() => {});
  }, []);

  // Active view tab
  const [activeTab, setActiveTab] = useState<string>('complaints');

  // Application Data State with LocalStorage caching
  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    const saved = localStorage.getItem('oakwood_complaints');
    return saved ? JSON.parse(saved) : INITIAL_COMPLAINTS;
  });

  const [notices, setNotices] = useState<Notice[]>(() => {
    const saved = localStorage.getItem('oakwood_notices');
    return saved ? JSON.parse(saved) : INITIAL_NOTICES;
  });

  const [bills, setBills] = useState<MaintenanceBill[]>(() => {
    const saved = localStorage.getItem('oakwood_bills');
    return saved ? JSON.parse(saved) : INITIAL_BILLS;
  });

  const [staffList, setStaffList] = useState<StaffMember[]>(STAFF_MEMBERS);
  const [units] = useState<SocietyUnit[]>(SOCIETY_UNITS);

  // Modal States
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isNewComplaintOpen, setIsNewComplaintOpen] = useState(false);

  // Filtering & Search for complaints (Resident View)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [towerFilter, setTowerFilter] = useState<string>('ALL');
  const [onlyMyUnit, setOnlyMyUnit] = useState(false);

  // Admin filter presets when navigating from Admin Dashboard
  const [adminInitialCategory, setAdminInitialCategory] = useState<string>('ALL');
  const [adminInitialStatus, setAdminInitialStatus] = useState<string>('ALL');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [complaintsUpdatedTrigger, setComplaintsUpdatedTrigger] = useState<number>(0);
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('oakwood_complaints', JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem('oakwood_notices', JSON.stringify(notices));
  }, [notices]);

  useEffect(() => {
    localStorage.setItem('oakwood_bills', JSON.stringify(bills));
  }, [bills]);

  // Handle role switch
  const handleSwitchRole = (role: UserRole) => {
    setCurrentRole(role);
    setCurrentUser(CURRENT_USERS[role]);
    if (role === 'ADMIN' && activeTab === 'complaints') {
      setActiveTab('dashboard');
    } else if (role === 'RESIDENT' && activeTab === 'dashboard') {
      setActiveTab('dashboard');
    }
    showToast(`Switched active view to ${role} (${CURRENT_USERS[role].name})`);
  };

  // Handle successful server authentication
  const handleAuthSuccess = (verifiedUser: CurrentUser, token: string) => {
    setCurrentUser(verifiedUser);
    setCurrentRole(verifiedUser.role);
    setIsAuthenticated(true);
    if (verifiedUser.role === 'ADMIN') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('dashboard');
    }
    setComplaintsUpdatedTrigger(prev => prev + 1);
  };

  // Handle logout
  const handleLogout = async () => {
    await logoutUser();
    setIsAuthenticated(false);
    setCurrentRole('RESIDENT');
    setCurrentUser(CURRENT_USERS.RESIDENT);
    showToast('Signed out of session');
    setComplaintsUpdatedTrigger(prev => prev + 1);
  };

  // Step 4: Raise new complaint handler with server API integration & initial status history
  const handleCreateComplaint = async (data: {
    title: string;
    description: string;
    category: ComplaintCategory;
    photoUrl?: string;
  }) => {
    setIsSubmittingComplaint(true);
    try {
      // Call server endpoint (POST /api/complaints)
      const res = await createResidentComplaint({
        title: data.title,
        description: data.description,
        category: data.category,
        photoUrl: data.photoUrl
      });

      if (res.success && res.data) {
        setComplaints(prev => [res.data!, ...prev]);
        setComplaintsUpdatedTrigger(prev => prev + 1);
        // setIsNewComplaintOpen(false);
        showToast(`Complaint ${res.data.ticketNumber} filed successfully! Status: OPEN.`); return res.data;
      } else {
        // Fallback in case of network issue
        const nextTicketNum = `CMP-${Math.floor(1000 + Math.random() * 9000)}`;
        const newComplaintId = `cmp_${Date.now()}`;
        const nowIso = new Date().toISOString();

        const initialHistoryEntry: ComplaintStatusHistory = {
          id: `sh_${Date.now()}_init`,
          complaintId: newComplaintId,
          newStatus: 'OPEN',
          actor: {
            id: currentUser.id,
            name: currentUser.name,
            role: currentUser.role,
          },
          timestamp: nowIso,
          note: 'Complaint registered by resident',
        };

        const newEntry: Complaint = {
          id: newComplaintId,
          ticketNumber: nextTicketNum,
          title: data.title,
          description: data.description,
          category: data.category,
          priority: 'MEDIUM',
          status: 'OPEN',
          unitNumber: currentUser.unitNumber || 'Unit 402',
          tower: currentUser.tower || 'Tower A',
          residentName: currentUser.name,
          residentContact: currentUser.phone,
          photoUrl: data.photoUrl,
          createdAt: nowIso,
          updatedAt: nowIso,
          statusHistory: [initialHistoryEntry],
          comments: []
        };

        setComplaints(prev => [newEntry, ...prev]);
        setComplaintsUpdatedTrigger(prev => prev + 1);
        // setIsNewComplaintOpen(false);
        showToast(`Complaint ${nextTicketNum} registered. Status: OPEN.`); return newEntry;
      }
    } catch (err: any) {
      showToast(`Error creating complaint: ${err.message || 'Please try again.'}`);
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  // Status update handler (creates new ComplaintStatusHistory record on every change)
  const handleUpdateStatus = (id: string, newStatus: ComplaintStatus, resolutionNotes?: string) => {
    const existingComplaint = complaints.find(c => c.id === id);

    setComplaints(prev => prev.map(c => {
      if (c.id === id) {
        const nowIso = new Date().toISOString();
        const updatedComments = [...(c.comments || [])];
        if (resolutionNotes) {
          updatedComments.push({
            id: `c_${Date.now()}`,
            author: currentUser.name,
            role: currentUser.role,
            text: `Resolution report: ${resolutionNotes}`,
            timestamp: nowIso
          });
        } else {
          updatedComments.push({
            id: `c_${Date.now()}`,
            author: currentUser.name,
            role: currentUser.role,
            text: `Status changed from ${c.status} to: ${newStatus.replace('_', ' ')}`,
            timestamp: nowIso
          });
        }

        const newHistoryRecord: ComplaintStatusHistory = {
          id: `sh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          complaintId: c.id,
          previousStatus: c.status,
          newStatus: newStatus,
          actor: {
            id: currentUser.id,
            name: currentUser.name,
            role: currentUser.role,
          },
          timestamp: nowIso,
          note: resolutionNotes || undefined,
        };

        const isResolved = newStatus === 'RESOLVED' || newStatus === 'CLOSED';

        const updated: Complaint = {
          ...c,
          status: newStatus,
          resolvedAt: isResolved ? nowIso : c.resolvedAt,
          resolutionNotes: resolutionNotes || c.resolutionNotes,
          updatedAt: nowIso,
          statusHistory: [...(c.statusHistory || []), newHistoryRecord],
          comments: updatedComments
        };

        if (selectedComplaint?.id === id) {
          setSelectedComplaint(updated);
        }
        return updated;
      }
      return c;
    }));

    // Send email notification to resident when admin changes status (asynchronous & non-blocking)
    if (existingComplaint && currentUser.role === 'ADMIN') {
      sendComplaintStatusEmailNotification(
        existingComplaint,
        newStatus,
        existingComplaint.status,
        resolutionNotes,
        currentUser,
        units
      ).then(emailRes => {
        if (emailRes.delivered) {
          showToast(`Resident notified via email (${emailRes.recipient})`);
        }
      }).catch(err => {
        console.error('[Email Notification Error]', err);
      });
    }

    showToast(`Status updated to ${newStatus.replace('_', ' ')}. History logged.`);
  };

  // Assign staff handler
  const handleAssignStaff = (id: string, staffId: string, staffName: string, staffPhone: string) => {
    setComplaints(prev => prev.map(c => {
      if (c.id === id) {
        const nowIso = new Date().toISOString();
        const updatedStatus: ComplaintStatus = c.status === 'OPEN' || c.status === 'SUBMITTED' || c.status === 'IN_REVIEW' ? 'IN_PROGRESS' : c.status;

        const newHistoryRecord: ComplaintStatusHistory = {
          id: `sh_${Date.now()}_assign`,
          complaintId: c.id,
          previousStatus: c.status,
          newStatus: updatedStatus,
          actor: {
            id: currentUser.id,
            name: currentUser.name,
            role: currentUser.role,
          },
          timestamp: nowIso,
          note: `Assigned technician ${staffName} (${staffPhone}) and marked In Progress.`,
        };

        const updated: Complaint = {
          ...c,
          assignedStaffId: staffId,
          assignedStaffName: staffName,
          staffContact: staffPhone,
          status: updatedStatus,
          updatedAt: nowIso,
          statusHistory: [...(c.statusHistory || []), newHistoryRecord],
          comments: [
            ...(c.comments || []),
            {
              id: `c_${Date.now()}`,
              author: currentUser.name,
              role: currentUser.role,
              text: `Assigned on-duty technician ${staffName} (${staffPhone}) to this ticket.`,
              timestamp: nowIso
            }
          ]
        };

        if (selectedComplaint?.id === id) {
          setSelectedComplaint(updated);
        }
        return updated;
      }
      return c;
    }));

    // Update staff active ticket count
    setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, activeTickets: s.activeTickets + 1 } : s));

    showToast(`Assigned technician ${staffName} to ticket`);
  };

  // Add comment handler
  const handleAddComment = (complaintId: string, commentText: string, isInternal: boolean) => {
    setComplaints(prev => prev.map(c => {
      if (c.id === complaintId) {
        const newComment = {
          id: `c_${Date.now()}`,
          author: currentUser.name,
          role: currentUser.role,
          text: commentText,
          timestamp: new Date().toISOString(),
          isInternal
        };

        const updated: Complaint = {
          ...c,
          updatedAt: new Date().toISOString(),
          comments: [...c.comments, newComment]
        };

        if (selectedComplaint?.id === complaintId) {
          setSelectedComplaint(updated);
        }
        return updated;
      }
      return c;
    }));

    showToast(isInternal ? 'Internal note added for staff' : 'Message posted to activity feed');
  };

  // Star rating handler
  const handleSubmitRating = (complaintId: string, rating: number, feedback: string) => {
    setComplaints(prev => prev.map(c => {
      if (c.id === complaintId) {
        const updated: Complaint = {
          ...c,
          rating,
          feedback,
          updatedAt: new Date().toISOString()
        };
        if (selectedComplaint?.id === complaintId) {
          setSelectedComplaint(updated);
        }
        return updated;
      }
      return c;
    }));

    showToast('Thank you for rating the maintenance service!');
  };

  // Notice Board Operations with server-side service & persistent database sync
  const handleAddNotice = async (noticeInput: CreateNoticeInput) => {
    // Optimistic local update
    const result = createNotice(currentUser, notices, noticeInput);
    if (result.success && result.data) {
      setNotices(result.data);
      const isPinned = Boolean(noticeInput.isPinned || noticeInput.isImportant);

      // If admin publishes an IMPORTANT notice: send email notification to residents via Resend
      if (isPinned && result.createdNotice) {
        sendImportantNoticeEmailNotification(result.createdNotice, units)
          .then(emailRes => {
            if (emailRes.delivered) {
              showToast(`Important notice emailed to ${emailRes.successfulDeliveries || 'all'} residents!`);
            } else if (emailRes.configured === false) {
              console.log('[Resend Notice Broadcast]', emailRes.message || 'Email service not configured');
            }
          })
          .catch(err => console.error('[Email Notification Error]', err));
      }

      showToast(isPinned 
        ? 'Important notice published and pinned to top of board' 
        : 'Notice published and broadcasted to residents');

      // Server persistence (createdById is derived from authenticated admin session)
      try {
        const serverRes = await createNoticeOnServer(noticeInput);
        if (serverRes.success && serverRes.notice) {
          // Re-sync server notices to get persistent UUID
          const fresh = await fetchNoticesFromServer();
          if (fresh.success && fresh.data) {
            setNotices(fresh.data);
          }
        }
      } catch (err) {
        console.warn('[Notice Server Create Failed]', err);
      }
    } else {
      showToast(result.error || 'Failed to publish notice');
    }
  };

  const handleUpdateNotice = async (id: string, updates: UpdateNoticeInput) => {
    // Optimistic local update
    const result = updateNotice(currentUser, notices, id, updates);
    if (result.success && result.data) {
      setNotices(result.data);
      showToast('Notice circular updated successfully');

      // Server persistence
      try {
        await updateNoticeOnServer(id, updates);
        const fresh = await fetchNoticesFromServer();
        if (fresh.success && fresh.data) {
          setNotices(fresh.data);
        }
      } catch (err) {
        console.warn('[Notice Server Update Failed]', err);
      }
    } else {
      showToast(result.error || 'Failed to update notice');
    }
  };

  const handleDeleteNotice = async (id: string) => {
    // Optimistic local update
    const result = deleteNotice(currentUser, notices, id);
    if (result.success && result.data) {
      setNotices(result.data);
      showToast('Notice deleted from circular board');

      // Server persistence
      try {
        await deleteNoticeOnServer(id);
        const fresh = await fetchNoticesFromServer();
        if (fresh.success && fresh.data) {
          setNotices(fresh.data);
        }
      } catch (err) {
        console.warn('[Notice Server Delete Failed]', err);
      }
    } else {
      showToast(result.error || 'Failed to delete notice');
    }
  };

  const handleTogglePinNotice = async (id: string) => {
    // Optimistic local update
    const result = toggleNoticeImportance(currentUser, notices, id);
    if (result.success && result.data) {
      setNotices(result.data);

      showToast(result.isImportant 
        ? 'Notice pinned to top of notice board' 
        : 'Notice unpinned from top');

      // Server persistence
      try {
        await updateNoticeOnServer(id, {
          isPinned: result.isImportant,
          isImportant: result.isImportant
        });
        const fresh = await fetchNoticesFromServer();
        if (fresh.success && fresh.data) {
          setNotices(fresh.data);
        }
      } catch (err) {
        console.warn('[Notice Server Toggle Pin Failed]', err);
      }
    } else {
      showToast(result.error || 'Failed to update pinned state');
    }
  };

  // Pay maintenance bill handler
  const handlePayBill = (billId: string, method: string) => {
    setBills(prev => prev.map(b => {
      if (b.id === billId) {
        return {
          ...b,
          status: 'PAID',
          paidDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          transactionId: `TXN-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          paymentMethod: method
        };
      }
      return b;
    }));
    showToast('Maintenance payment processed successfully! Receipt generated.');
  };

  // Filter complaints
  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.unitNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === 'ALL' ||
      (statusFilter === 'OPEN' && c.status !== 'RESOLVED' && c.status !== 'CLOSED') ||
      (statusFilter === 'RESOLVED' && (c.status === 'RESOLVED' || c.status === 'CLOSED')) ||
      c.status === statusFilter;

    const matchesCategory = categoryFilter === 'ALL' || c.category === categoryFilter;
    const matchesPriority = priorityFilter === 'ALL' || c.priority === priorityFilter;
    const matchesTower = towerFilter === 'ALL' || c.tower === towerFilter;
    const matchesMyUnit = !onlyMyUnit || c.unitNumber === currentUser.unitNumber;

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority && matchesTower && matchesMyUnit;
  });

  // Calculate role-appropriate active tickets count
  const relevantComplaintsForRole = currentUser.role === 'ADMIN'
    ? complaints
    : currentUser.role === 'TECHNICIAN'
    ? complaints.filter(c => !c.assignedStaffId || c.assignedStaffName === currentUser.name || c.assignedStaffId === currentUser.id)
    : complaints.filter(c => 
        c.residentName === currentUser.name || 
        c.unitNumber === currentUser.unitNumber ||
        (currentUser.id && c.userId === currentUser.id)
      );

  const openTicketsCount = relevantComplaintsForRole.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
  const unreadNoticesCount = notices.filter(n => n.priority === 'HIGH' || n.priority === 'URGENT').length;

  // If user is not signed in, show the full-screen Luxury Login Page matching the reference design
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage
          appName="Oakwood Heights"
          societyTagline="Report maintenance issues, track complaint status, and stay updated with your society."
          onLoginSuccess={(user, token) => {
            handleAuthSuccess(user, token);
            showToast(`Welcome back, ${user.name}!`);
          }}
        />

        {/* Global Toast Message */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#1F2937] text-white px-4 py-3 rounded-xl shadow-2xl border border-[#374151] text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  const isResidentDashboard = currentUser.role === 'RESIDENT';

  return (
    <div className={`min-h-screen bg-[#0B1121] text-slate-200 flex flex-col antialiased transition-colors`}>
      
      {/* Top Navbar */}
      {!isResidentDashboard && (
        <Navbar
          currentUser={currentUser}
          onSwitchRole={handleSwitchRole}
          onOpenNewComplaint={() => setIsNewComplaintOpen(true)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unreadNoticesCount={unreadNoticesCount}
          openTicketsCount={openTicketsCount}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
        />
      )}

      {/* Main Container */}
      {!isResidentDashboard ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
          
          {/* Metric statistics overview (Only shown on non-complaint tabs or admin mode to avoid duplication) */}
          {(currentUser.role === 'ADMIN' || activeTab !== 'complaints') && (
            <StatsOverview
              currentUser={currentUser}
              complaints={complaints}
              bills={bills}
              unreadNoticesCount={unreadNoticesCount}
              onFilterStatus={(status) => {
                setActiveTab('complaints');
                setStatusFilter(status);
              }}
              onNavigateTab={(tab) => {
                setActiveTab(tab);
              }}
            />
          )}

          {/* Tab 0: Admin Dashboard */}
          {activeTab === 'dashboard' && (
            currentUser.role === 'ADMIN' ? (
              <AdminDashboard
                currentUser={currentUser}
                complaints={complaints}
                units={units}
                onSelectComplaint={(c) => setSelectedComplaint(c)}
                onNavigateToComplaints={(filter) => {
                  if (filter?.category) setAdminInitialCategory(filter.category);
                  else setAdminInitialCategory('ALL');

                  if (filter?.status) setAdminInitialStatus(filter.status);
                  else if (filter?.overdueOnly) setAdminInitialStatus('OVERDUE');
                  else setAdminInitialStatus('ALL');

                  setActiveTab('complaints');
                }}
                onShowToast={showToast}
              />
            ) : (
              <div className="bg-[#111827] p-8 rounded-2xl border border-[#1F2937] text-center">
                <p className="text-sm font-semibold text-slate-300">Please switch to Administrator role to view the Admin Dashboard.</p>
              </div>
            )
          )}

          {/* Tab 1: Complaints Desk */}
          {activeTab === 'complaints' && (
            currentUser.role === 'ADMIN' && (
              <AdminComplaintManagement
                currentUser={currentUser}
                complaints={complaints}
                units={units}
                initialCategory={adminInitialCategory}
                initialStatus={adminInitialStatus}
                onUpdateComplaints={setComplaints}
                onSelectComplaint={(c) => setSelectedComplaint(c)}
                onShowToast={showToast}
                onNavigateToDashboard={() => setActiveTab('dashboard')}
              />
            )
          )}

          {/* Tab 2: Notices Board */}
          {activeTab === 'notices' && (
            <NoticesBoard
              notices={notices}
              currentUser={currentUser}
              onAddNotice={handleAddNotice}
              onUpdateNotice={handleUpdateNotice}
              onDeleteNotice={handleDeleteNotice}
              onTogglePin={handleTogglePinNotice}
              onShowToast={showToast}
            />
          )}

          {/* Tab 3: Dues & Billing */}
          {activeTab === 'dues' && (
            <DuesAndBilling
              bills={bills}
              currentUser={currentUser}
              onPayBill={handlePayBill}
            />
          )}

          {/* Tab 4: Units & Residents Directory (Admin only) */}
          {activeTab === 'units' && (
            <UnitsDirectory
              units={units}
              currentUser={currentUser}
            />
          )}

          {/* Tab 5: Facility Staff Roster */}
          {activeTab === 'staff' && (
            <StaffRoster
              staffList={staffList}
              currentUser={currentUser}
            />
          )}

        </main>
      ) : (
                <ResidentComplaintsView
          activeTab={activeTab}
          currentUser={currentUser}
          allComplaints={complaints}
          notices={notices}
          bills={bills}
          onSelectComplaint={(c) => setSelectedComplaint(c)}
          onOpenNewComplaint={() => setIsNewComplaintOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onNavigateTab={(tab) => setActiveTab(tab)}
          showToast={showToast}
          complaintsUpdatedTrigger={complaintsUpdatedTrigger}
          onLogout={handleLogout}
        >
          {activeTab === 'notices' && (
            <NoticesBoard
              notices={notices}
              currentUser={currentUser}
              onAddNotice={handleAddNotice}
              onUpdateNotice={handleUpdateNotice}
              onDeleteNotice={handleDeleteNotice}
              onTogglePin={handleTogglePinNotice}
              onShowToast={showToast}
            />
          )}
          {activeTab === 'dues' && (
            <DuesAndBilling
              bills={bills}
              currentUser={currentUser}
              onPayBill={handlePayBill}
            />
          )}
          {activeTab === 'staff' && (
            <StaffRoster
              staffList={staffList}
              currentUser={currentUser}
            />
          )}
        </ResidentComplaintsView>
      )}

      {/* Complaint Details Modal */}
      {selectedComplaint && (
        <ComplaintDetailsModal
          complaint={selectedComplaint}
          currentUser={currentUser}
          onClose={() => setSelectedComplaint(null)}
        />
      )}

      {/* New Complaint Modal */}
      {isNewComplaintOpen && (
        <NewComplaintModal
          currentUser={currentUser}
          onClose={() => setIsNewComplaintOpen(false)}
          onSubmit={handleCreateComplaint}
        />
      )}

      {/* Authentication & Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        onShowToast={showToast}
      />

      {/* Global Toast Message */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1F2937] text-white px-4 py-3 rounded-xl shadow-2xl border border-[#374151] text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
