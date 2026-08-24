import { Complaint, StaffMember, Notice, MaintenanceBill, SocietyUnit, CurrentUser } from '../types';

export const CURRENT_USERS: Record<string, CurrentUser> = {
  RESIDENT: {
    id: 'usr_res_101',
    name: 'Sarah Jenkins',
    role: 'RESIDENT',
    unitNumber: 'A-402',
    tower: 'Tower A',
    email: 'sarah.jenkins@oakwood.io',
    phone: '+1 (555) 234-8901',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  ADMIN: {
    id: 'usr_adm_001',
    name: 'Rajesh Sharma (Secretary)',
    role: 'ADMIN',
    unitNumber: 'B-104',
    tower: 'Tower B',
    email: 'secretary@oakwoodresidency.org',
    phone: '+1 (555) 888-1234',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
  TECHNICIAN: {
    id: 'usr_tech_002',
    name: 'David Miller (Senior Plumber)',
    role: 'TECHNICIAN',
    unitNumber: 'Facility Office #2',
    tower: 'Clubhouse Ground',
    email: 'david.plumbing@facilitycare.com',
    phone: '+1 (555) 432-7711',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  }
};

export const STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'staff_1',
    name: 'David Miller',
    role: 'Lead Plumber & Piping Specialist',
    category: 'PLUMBING',
    phone: '+1 (555) 432-7711',
    rating: 4.9,
    activeTickets: 2,
    isAvailable: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'staff_2',
    name: 'Marcus Vance',
    role: 'Certified Master Electrician',
    category: 'ELECTRICAL',
    phone: '+1 (555) 678-2234',
    rating: 4.8,
    activeTickets: 3,
    isAvailable: true,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'staff_3',
    name: 'Elena Rostova',
    role: 'Elevator & Heavy Equipment Tech',
    category: 'ELEVATOR',
    phone: '+1 (555) 912-3345',
    rating: 4.95,
    activeTickets: 1,
    isAvailable: true,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'staff_4',
    name: 'Carlos Mendez',
    role: 'Civil & Carpentry Lead',
    category: 'CARPENTRY',
    phone: '+1 (555) 345-9988',
    rating: 4.7,
    activeTickets: 0,
    isAvailable: true,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'staff_5',
    name: 'Samuel Jackson',
    role: 'Sanitation & Pest Control Supervisor',
    category: 'SANITATION',
    phone: '+1 (555) 789-0012',
    rating: 4.85,
    activeTickets: 1,
    isAvailable: false,
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  },
];
export const INITIAL_COMPLAINTS: Complaint[] = [];

export const INITIAL_NOTICES: Notice[] = [
  {
    id: 'not_001',
    title: 'Scheduled Water Supply Interruption for Tank Cleaning',
    content: 'Please be informed that the Overhead Water Tanks of Tower A and Tower B will undergo bi-annual automated scrubbing and chlorination. Main water supply will be paused from 10:00 AM to 3:00 PM this coming Thursday, August 27th. Please store sufficient water in advance.',
    category: 'MAINTENANCE',
    priority: 'HIGH',
    date: 'August 22, 2026',
    createdAt: '2026-08-22T08:00:00Z',
    updatedAt: '2026-08-22T08:00:00Z',
    author: 'Estate Management Office',
    authorRole: 'Chief Facility Manager',
    targetAudience: 'Tower A & B Residents',
    isPinned: true,
    isImportant: true
  },
  {
    id: 'not_002',
    title: 'Annual General Body Meeting (AGM) & Committee Elections',
    content: 'The 12th Annual General Body Meeting of Oakwood Residency will be held in the Central Clubhouse Banquet Hall on Sunday, September 6, 2026 at 10:30 AM. Agenda includes annual budget approval, security system upgrade proposals, and committee nominations.',
    category: 'EVENT',
    priority: 'NORMAL',
    date: 'August 20, 2026',
    createdAt: '2026-08-20T10:30:00Z',
    updatedAt: '2026-08-20T10:30:00Z',
    author: 'Rajesh Sharma',
    authorRole: 'Society Secretary',
    targetAudience: 'All Homeowners',
    isPinned: true,
    isImportant: true
  },
  {
    id: 'not_003',
    title: 'Urgent: Strict Speed Limit 15 km/h in Basement Parking',
    content: 'Multiple instances of speeding vehicles in Basement Level 1 & 2 have been reported by the security team. Please adhere strictly to the 15 km/h limit. Speed bumps have been re-painted with reflective neon markers.',
    category: 'RULE',
    priority: 'URGENT',
    date: 'August 19, 2026',
    createdAt: '2026-08-19T14:15:00Z',
    updatedAt: '2026-08-19T14:15:00Z',
    author: 'Security Directorate',
    authorRole: 'Head of Safety',
    targetAudience: 'All Residents & Drivers',
    isPinned: false,
    isImportant: false
  },
  {
    id: 'not_004',
    title: 'Monsoon Pest Control & Mosquito Fogging Drive',
    content: 'Fogging drive will be conducted across all common areas, garden walkways, basement drain channels, and podiums starting this Friday evening at 6:30 PM. Please keep balcony windows closed during fogging.',
    category: 'MAINTENANCE',
    priority: 'NORMAL',
    date: 'August 18, 2026',
    createdAt: '2026-08-18T09:00:00Z',
    updatedAt: '2026-08-18T09:00:00Z',
    author: 'Health & Sanitation Committee',
    authorRole: 'Committee Member',
    targetAudience: 'All Towers',
    isPinned: false,
    isImportant: false
  },
  {
    id: 'not_005',
    title: 'Emergency Power Substation Transformer Testing',
    content: 'The electrical safety board will conduct preventive thermal imaging and load-switching tests on the main 11kV transformer unit between 2:00 AM and 4:00 AM on Wednesday. Diesel generators will support elevators and corridor lighting during the test.',
    category: 'EMERGENCY',
    priority: 'HIGH',
    date: 'August 17, 2026',
    createdAt: '2026-08-17T11:00:00Z',
    updatedAt: '2026-08-17T11:00:00Z',
    author: 'Engineering & Electrical Team',
    authorRole: 'Senior Electrical Engineer',
    targetAudience: 'All Residents',
    isPinned: false,
    isImportant: false
  }
];

export const INITIAL_BILLS: MaintenanceBill[] = [
  {
    id: 'bill_2026_08',
    unitNumber: 'A-402',
    residentName: 'Sarah Jenkins',
    month: 'August',
    year: 2026,
    amount: 285.00,
    dueDate: 'August 31, 2026',
    status: 'PENDING',
    breakdown: {
      maintenanceCharge: 180.00,
      sinkingFund: 35.00,
      waterCharge: 25.00,
      parkingCharge: 20.00,
      securityCharge: 15.00,
      tax: 10.00
    }
  },
  {
    id: 'bill_2026_07',
    unitNumber: 'A-402',
    residentName: 'Sarah Jenkins',
    month: 'July',
    year: 2026,
    amount: 285.00,
    dueDate: 'July 31, 2026',
    status: 'PAID',
    paidDate: 'July 14, 2026',
    transactionId: 'TXN-9982481029',
    paymentMethod: 'Auto-Debit / UPI',
    breakdown: {
      maintenanceCharge: 180.00,
      sinkingFund: 35.00,
      waterCharge: 25.00,
      parkingCharge: 20.00,
      securityCharge: 15.00,
      tax: 10.00
    }
  },
  {
    id: 'bill_2026_06',
    unitNumber: 'A-402',
    residentName: 'Sarah Jenkins',
    month: 'June',
    year: 2026,
    amount: 285.00,
    dueDate: 'June 30, 2026',
    status: 'PAID',
    paidDate: 'June 09, 2026',
    transactionId: 'TXN-8819230192',
    paymentMethod: 'Credit Card',
    breakdown: {
      maintenanceCharge: 180.00,
      sinkingFund: 35.00,
      waterCharge: 25.00,
      parkingCharge: 20.00,
      securityCharge: 15.00,
      tax: 10.00
    }
  }
];

export const SOCIETY_UNITS: SocietyUnit[] = [
  {
    id: 'unit_101',
    unitNumber: 'A-402',
    tower: 'Tower A',
    floor: 4,
    ownerName: 'Sarah Jenkins',
    occupancyType: 'OWNER_OCCUPIED',
    contact: '+1 (555) 234-8901',
    email: 'sarah.jenkins@oakwood.io',
    dueAmount: 285.00,
    dueStatus: 'PENDING'
  },
  {
    id: 'unit_102',
    unitNumber: 'A-405',
    tower: 'Tower A',
    floor: 4,
    ownerName: 'Anita Desai',
    occupancyType: 'OWNER_OCCUPIED',
    contact: '+1 (555) 671-9988',
    email: 'anita.desai@email.com',
    dueAmount: 0.00,
    dueStatus: 'CLEAR'
  },
  {
    id: 'unit_103',
    unitNumber: 'B-104',
    tower: 'Tower B',
    floor: 1,
    ownerName: 'Rajesh Sharma',
    occupancyType: 'OWNER_OCCUPIED',
    contact: '+1 (555) 888-1234',
    email: 'secretary@oakwoodresidency.org',
    dueAmount: 0.00,
    dueStatus: 'CLEAR'
  },
  {
    id: 'unit_104',
    unitNumber: 'B-801',
    tower: 'Tower B',
    floor: 8,
    ownerName: 'Arthur Pendelton',
    tenantName: 'Michael Chang',
    occupancyType: 'RENTED',
    contact: '+1 (555) 349-1122',
    email: 'm.chang@techhub.io',
    dueAmount: 570.00,
    dueStatus: 'OVERDUE'
  },
  {
    id: 'unit_105',
    unitNumber: 'C-202',
    tower: 'Tower C',
    floor: 2,
    ownerName: 'Robert Fox',
    occupancyType: 'OWNER_OCCUPIED',
    contact: '+1 (555) 902-3344',
    email: 'robert.fox@global.net',
    dueAmount: 0.00,
    dueStatus: 'CLEAR'
  },
  {
    id: 'unit_106',
    unitNumber: 'C-604',
    tower: 'Tower C',
    floor: 6,
    ownerName: 'Emma Watson',
    occupancyType: 'OWNER_OCCUPIED',
    contact: '+1 (555) 123-7890',
    email: 'emma.watson@design.co',
    dueAmount: 285.00,
    dueStatus: 'PENDING'
  }
];
