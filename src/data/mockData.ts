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

export const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'cmp_100',
    ticketNumber: 'TKT-2026-0901',
    title: 'Door handle needs repair',
    description: 'Door handle is loose and needs repair. The latch occasionally gets stuck from inside, requiring firm jiggling.',
    category: 'CARPENTRY',
    priority: 'MEDIUM',
    status: 'OPEN',
    unitNumber: 'A-402',
    tower: 'Tower A',
    residentName: 'Aarushi',
    residentContact: '+1 (555) 234-8901',
    photoUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80',
    createdAt: '2026-08-23T22:32:00Z',
    updatedAt: '2026-08-23T22:32:00Z',
    statusHistory: [
      {
        id: 'sh_100_1',
        complaintId: 'cmp_100',
        newStatus: 'OPEN',
        actor: { id: 'usr_res_101', name: 'Aarushi', role: 'RESIDENT' },
        timestamp: '2026-08-23T22:32:00Z',
        note: 'Submitted by Aarushi'
      }
    ],
    comments: []
  },
  {
    id: 'cmp_101',
    ticketNumber: 'TKT-2026-0891',
    title: 'Severe water seepage in Master Bathroom ceiling',
    description: 'Continuous dripping from the false ceiling in the master bathroom since yesterday evening. Might be leakage from the unit above (A-502). Need urgent inspection before it ruins the drywall.',
    category: 'PLUMBING',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    unitNumber: 'A-402',
    tower: 'Tower A',
    residentName: 'Sarah Jenkins',
    residentContact: '+1 (555) 234-8901',
    photoUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
    createdAt: '2026-08-21T09:30:00Z',
    updatedAt: '2026-08-22T08:15:00Z',
    scheduledSlot: 'Today, 2:00 PM - 4:00 PM',
    assignedStaffId: 'staff_1',
    assignedStaffName: 'David Miller',
    staffContact: '+1 (555) 432-7711',
    estimatedResolution: 'Today by 5:00 PM',
    statusHistory: [
      {
        id: 'sh_101_1',
        complaintId: 'cmp_101',
        newStatus: 'OPEN',
        actor: { id: 'usr_res_101', name: 'Sarah Jenkins', role: 'RESIDENT' },
        timestamp: '2026-08-21T09:30:00Z',
        note: 'Complaint registered by resident with High urgency.'
      },
      {
        id: 'sh_101_2',
        complaintId: 'cmp_101',
        previousStatus: 'OPEN',
        newStatus: 'IN_PROGRESS',
        actor: { id: 'usr_adm_001', name: 'Rajesh Sharma', role: 'ADMIN' },
        timestamp: '2026-08-21T11:20:00Z',
        note: 'Admin assigned David Miller (Lead Plumber) and moved ticket to in-progress.'
      }
    ],
    comments: [
      {
        id: 'c1',
        author: 'Sarah Jenkins',
        role: 'RESIDENT',
        text: 'The water is dripping faster now, placed a bucket underneath.',
        timestamp: '2026-08-21T10:05:00Z'
      },
      {
        id: 'c2',
        author: 'Rajesh Sharma',
        role: 'ADMIN',
        text: 'Assigned to David Miller on high priority. Contacted A-502 resident to ensure access.',
        timestamp: '2026-08-21T11:20:00Z'
      },
      {
        id: 'c3',
        author: 'David Miller',
        role: 'TECHNICIAN',
        text: 'Inspected overhead connection. Isolated the valve in A-502. Replacing the joint washer now.',
        timestamp: '2026-08-22T08:15:00Z'
      }
    ]
  },
  {
    id: 'cmp_102',
    ticketNumber: 'TKT-2026-0892',
    title: 'Lift #2 in Tower B making grinding sound & jerky stop',
    description: 'Passenger Elevator B-2 vibrates heavily when moving between 7th and 10th floors and halts with a hard jolt. Please schedule immediate safety calibration.',
    category: 'ELEVATOR',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    unitNumber: 'B-801',
    tower: 'Tower B',
    residentName: 'Michael Chang',
    residentContact: '+1 (555) 349-1122',
    createdAt: '2026-08-22T06:45:00Z',
    updatedAt: '2026-08-22T10:00:00Z',
    scheduledSlot: 'Today, 11:00 AM - 1:00 PM',
    assignedStaffId: 'staff_3',
    assignedStaffName: 'Elena Rostova',
    staffContact: '+1 (555) 912-3345',
    estimatedResolution: 'Today by 3:00 PM',
    statusHistory: [
      {
        id: 'sh_102_1',
        complaintId: 'cmp_102',
        newStatus: 'OPEN',
        actor: { id: 'usr_res_102', name: 'Michael Chang', role: 'RESIDENT' },
        timestamp: '2026-08-22T06:45:00Z',
        note: 'Elevator safety complaint lodged.'
      },
      {
        id: 'sh_102_2',
        complaintId: 'cmp_102',
        previousStatus: 'OPEN',
        newStatus: 'IN_PROGRESS',
        actor: { id: 'usr_adm_001', name: 'Rajesh Sharma', role: 'ADMIN' },
        timestamp: '2026-08-22T07:30:00Z',
        note: 'Admin switched elevator to service mode and assigned OEM technician Elena.'
      }
    ],
    comments: [
      {
        id: 'c4',
        author: 'Rajesh Sharma',
        role: 'ADMIN',
        text: 'Lift put on maintenance mode. Schindler certified technician Elena on site.',
        timestamp: '2026-08-22T07:30:00Z'
      }
    ]
  },
  {
    id: 'cmp_103',
    ticketNumber: 'TKT-2026-0888',
    title: 'Corridor emergency backup lights flickering on 4th floor',
    description: 'Three tube lights near the fire exit stairs on 4th floor Tower A are flickering continuously and humming.',
    category: 'ELECTRICAL',
    priority: 'MEDIUM',
    status: 'OPEN',
    unitNumber: 'A-405',
    tower: 'Tower A',
    residentName: 'Anita Desai',
    residentContact: '+1 (555) 671-9988',
    createdAt: '2026-08-21T16:20:00Z',
    updatedAt: '2026-08-22T09:00:00Z',
    scheduledSlot: 'Tomorrow, 10:00 AM',
    assignedStaffId: 'staff_2',
    assignedStaffName: 'Marcus Vance',
    staffContact: '+1 (555) 678-2234',
    statusHistory: [
      {
        id: 'sh_103_1',
        complaintId: 'cmp_103',
        newStatus: 'OPEN',
        actor: { id: 'usr_res_103', name: 'Anita Desai', role: 'RESIDENT' },
        timestamp: '2026-08-21T16:20:00Z',
        note: 'Electrical corridor light flickering reported.'
      }
    ],
    comments: [
      {
        id: 'c5',
        author: 'Marcus Vance',
        role: 'TECHNICIAN',
        text: 'New LED ballast fixtures fetched from inventory. Will replace tomorrow morning.',
        timestamp: '2026-08-22T09:00:00Z'
      }
    ]
  },
  {
    id: 'cmp_104',
    ticketNumber: 'TKT-2026-0885',
    title: 'Main Clubhouse gym treadmill belt slipped off track',
    description: 'Treadmill #3 display shows motor error and belt is loose. Unusable for morning workouts.',
    category: 'OTHER',
    priority: 'LOW',
    status: 'OPEN',
    unitNumber: 'C-202',
    tower: 'Tower C',
    residentName: 'Robert Fox',
    residentContact: '+1 (555) 902-3344',
    createdAt: '2026-08-22T11:15:00Z',
    updatedAt: '2026-08-22T11:15:00Z',
    statusHistory: [
      {
        id: 'sh_104_1',
        complaintId: 'cmp_104',
        newStatus: 'OPEN',
        actor: { id: 'usr_res_104', name: 'Robert Fox', role: 'RESIDENT' },
        timestamp: '2026-08-22T11:15:00Z',
        note: 'Treadmill issue logged.'
      }
    ],
    comments: []
  },
  {
    id: 'cmp_105',
    ticketNumber: 'TKT-2026-0870',
    title: 'Broken balcony slider lock replacement',
    description: 'The locking latch on the glass sliding door is stripped and won’t lock properly.',
    category: 'CARPENTRY',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    unitNumber: 'A-402',
    tower: 'Tower A',
    residentName: 'Sarah Jenkins',
    residentContact: '+1 (555) 234-8901',
    createdAt: '2026-08-18T14:00:00Z',
    updatedAt: '2026-08-19T16:30:00Z',
    resolvedAt: '2026-08-19T16:30:00Z',
    assignedStaffId: 'staff_4',
    assignedStaffName: 'Carlos Mendez',
    staffContact: '+1 (555) 345-9988',
    resolutionNotes: 'Replaced multi-point locking mechanism and lubricated track rollers. Tested smoothly.',
    rating: 5,
    feedback: 'Carlos arrived on time and fixed it in under 20 minutes! Excellent work.',
    statusHistory: [
      {
        id: 'sh_105_1',
        complaintId: 'cmp_105',
        newStatus: 'OPEN',
        actor: { id: 'usr_res_101', name: 'Sarah Jenkins', role: 'RESIDENT' },
        timestamp: '2026-08-18T14:00:00Z',
        note: 'Balcony slider lock issue reported.'
      },
      {
        id: 'sh_105_2',
        complaintId: 'cmp_105',
        previousStatus: 'OPEN',
        newStatus: 'IN_PROGRESS',
        actor: { id: 'usr_adm_001', name: 'Rajesh Sharma', role: 'ADMIN' },
        timestamp: '2026-08-18T15:30:00Z',
        note: 'Assigned to Carlos Mendez.'
      },
      {
        id: 'sh_105_3',
        complaintId: 'cmp_105',
        previousStatus: 'IN_PROGRESS',
        newStatus: 'RESOLVED',
        actor: { id: 'usr_adm_001', name: 'Rajesh Sharma', role: 'ADMIN' },
        timestamp: '2026-08-19T16:30:00Z',
        note: 'Lock replaced and tested. Marked as resolved (closed).'
      }
    ],
    comments: [
      {
        id: 'c6',
        author: 'Carlos Mendez',
        role: 'TECHNICIAN',
        text: 'Work completed. New brass lock installed.',
        timestamp: '2026-08-19T16:30:00Z'
      }
    ]
  },
  {
    id: 'cmp_106',
    ticketNumber: 'TKT-2026-0865',
    title: 'Garbage chute blockage on 6th Floor Tower C',
    description: 'Trash chute hatch won’t open completely due to obstruction lodged inside shaft.',
    category: 'SANITATION',
    priority: 'HIGH',
    status: 'RESOLVED',
    unitNumber: 'C-604',
    tower: 'Tower C',
    residentName: 'Emma Watson',
    residentContact: '+1 (555) 123-7890',
    createdAt: '2026-08-17T08:00:00Z',
    updatedAt: '2026-08-17T14:00:00Z',
    resolvedAt: '2026-08-17T14:00:00Z',
    assignedStaffId: 'staff_5',
    assignedStaffName: 'Samuel Jackson',
    staffContact: '+1 (555) 789-0012',
    resolutionNotes: 'Shaft cleared from bottom access room and sanitized.',
    rating: 4,
    feedback: 'Prompt response from maintenance crew.',
    statusHistory: [
      {
        id: 'sh_106_1',
        complaintId: 'cmp_106',
        newStatus: 'OPEN',
        actor: { id: 'usr_res_106', name: 'Emma Watson', role: 'RESIDENT' },
        timestamp: '2026-08-17T08:00:00Z',
        note: 'Garbage chute blockage reported.'
      },
      {
        id: 'sh_106_2',
        complaintId: 'cmp_106',
        previousStatus: 'OPEN',
        newStatus: 'IN_PROGRESS',
        actor: { id: 'usr_adm_001', name: 'Rajesh Sharma', role: 'ADMIN' },
        timestamp: '2026-08-17T09:00:00Z',
        note: 'Sanitation team deployed.'
      },
      {
        id: 'sh_106_3',
        complaintId: 'cmp_106',
        previousStatus: 'IN_PROGRESS',
        newStatus: 'RESOLVED',
        actor: { id: 'usr_adm_001', name: 'Rajesh Sharma', role: 'ADMIN' },
        timestamp: '2026-08-17T14:00:00Z',
        note: 'Obstruction cleared and chute sanitized.'
      }
    ],
    comments: [
      {
        id: 'c7',
        author: 'Samuel Jackson',
        role: 'TECHNICIAN',
        text: 'Cleared heavy cardboard box lodged near floor 4 bend.',
        timestamp: '2026-08-17T14:00:00Z'
      }
    ]
  },
  {
    id: 'cmp_107',
    ticketNumber: 'TKT-2026-0842',
    title: 'Basement P2 main hydro pump abnormal pressure fluctuation & vibration',
    description: 'Hydro-pneumatic booster pump #2 in Basement P2 is dropping pressure intermittently and causing severe water hammer noise across Tower B riser lines.',
    category: 'PLUMBING',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    unitNumber: 'B-304',
    tower: 'Tower B',
    residentName: 'David Kumar',
    residentContact: '+1 (555) 781-4432',
    createdAt: '2026-08-16T10:00:00Z',
    updatedAt: '2026-08-18T11:00:00Z',
    assignedStaffId: 'staff_1',
    assignedStaffName: 'David Miller',
    staffContact: '+1 (555) 432-7711',
    statusHistory: [
      {
        id: 'sh_107_1',
        complaintId: 'cmp_107',
        newStatus: 'OPEN',
        actor: { id: 'usr_res_107', name: 'David Kumar', role: 'RESIDENT' },
        timestamp: '2026-08-16T10:00:00Z',
        note: 'Pump pressure drop reported.'
      },
      {
        id: 'sh_107_2',
        complaintId: 'cmp_107',
        previousStatus: 'OPEN',
        newStatus: 'IN_PROGRESS',
        actor: { id: 'usr_adm_001', name: 'Rajesh Sharma', role: 'ADMIN' },
        timestamp: '2026-08-17T09:30:00Z',
        note: 'Assigned to David Miller to diagnose booster impeller.'
      }
    ],
    comments: [
      {
        id: 'c8',
        author: 'David Miller',
        role: 'TECHNICIAN',
        text: 'Pressure diaphragm replacement part ordered from supplier.',
        timestamp: '2026-08-18T11:00:00Z'
      }
    ]
  },
  {
    id: 'cmp_108',
    ticketNumber: 'TKT-2026-0850',
    title: 'Main vehicle entry gate boom barrier optical sensor alignment failure',
    description: 'RFID automatic boom barrier at North Gate fails to detect registered resident tags intermittently, forcing manual security override during peak morning hours.',
    category: 'SECURITY',
    priority: 'MEDIUM',
    status: 'OPEN',
    unitNumber: 'A-102',
    tower: 'Tower A',
    residentName: 'Priya Patel',
    residentContact: '+1 (555) 890-5544',
    createdAt: '2026-08-17T14:30:00Z',
    updatedAt: '2026-08-17T14:30:00Z',
    statusHistory: [
      {
        id: 'sh_108_1',
        complaintId: 'cmp_108',
        newStatus: 'OPEN',
        actor: { id: 'usr_res_108', name: 'Priya Patel', role: 'RESIDENT' },
        timestamp: '2026-08-17T14:30:00Z',
        note: 'Boom barrier issue registered.'
      }
    ],
    comments: []
  }
];

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
