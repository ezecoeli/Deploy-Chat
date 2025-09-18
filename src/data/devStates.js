import { 
  FaCode, FaWrench, FaEye, FaFlask, FaRocket, FaBook, 
  FaFileAlt, FaBullseye, FaFire, FaCrosshairs, FaCoffee,
  FaBed, FaBrain, FaCircle, FaPizzaSlice, FaClock, 
} from 'react-icons/fa';
import { 
  MdWork, MdMood, MdNotifications, MdDoNotDisturb, MdDirectionsWalk 
} from 'react-icons/md';
import { LuPartyPopper } from "react-icons/lu";

export const workStates = [
  { 
    id: 'coding', 
    icon: FaCode, 
    label: 'Coding', 
    color: '#10b981',
    description: 'Writing code'
  },
  { 
    id: 'debugging', 
    icon: FaWrench, 
    label: 'Debugging', 
    color: '#f59e0b',
    description: 'Fixing bugs'
  },
  { 
    id: 'reviewing', 
    icon: FaEye, 
    label: 'Code Review', 
    color: '#3b82f6',
    description: 'Reviewing code'
  },
  { 
    id: 'testing', 
    icon: FaFlask, 
    label: 'Testing', 
    color: '#8b5cf6',
    description: 'Running tests'
  },
  { 
    id: 'deploying', 
    icon: FaRocket, 
    label: 'Deploying', 
    color: '#ef4444',
    description: 'Deploying to production'
  },
  { 
    id: 'learning', 
    icon: FaBook, 
    label: 'Learning', 
    color: '#06b6d4',
    description: 'Reading documentation'
  },
  { 
    id: 'documenting', 
    icon: FaFileAlt, 
    label: 'Documenting', 
    color: '#84cc16',
    description: 'Writing documentation'
  },
  { 
    id: 'meeting', 
    icon: FaBullseye, 
    label: 'In Meeting', 
    color: '#f97316',
    description: 'Attending meeting'
  }
];

export const moodStates = [
  { 
    id: 'fire', 
    icon: FaFire, 
    label: 'On Fire', 
    color: '#dc2626',
    description: 'Highly productive'
  },
  { 
    id: 'focused', 
    icon: FaCrosshairs, 
    label: 'Deep Focus', 
    color: '#7c3aed',
    description: 'In the zone'
  },
  { 
    id: 'coffee', 
    icon: FaCoffee, 
    label: 'Coffee Break', 
    color: '#92400e',
    description: 'Taking a coffee break'
  },
  { 
    id: 'tired', 
    icon: FaBed, 
    label: 'Need Rest', 
    color: '#6b7280',
    description: 'Feeling tired'
  },
  { 
    id: 'thinking', 
    icon: FaBrain, 
    label: 'Thinking', 
    color: '#059669',
    description: 'Working through a problem'
  },
  { 
    id: 'celebrate', 
    icon: LuPartyPopper, 
    label: 'Victory', 
    color: '#db2777',
    description: 'Just accomplished something'
  }
];

export const availabilityStates = [
  { 
    id: 'available', 
    icon: FaCircle, 
    label: 'Available', 
    color: '#22c55e',
    description: 'Available for chat'
  },
  { 
    id: 'busy', 
    icon: MdDoNotDisturb, 
    label: 'Do Not Disturb', 
    color: '#ef4444',
    description: 'Please do not interrupt'
  },
  { 
    id: 'away', 
    icon: MdDirectionsWalk, 
    label: 'Away', 
    color: '#eab308',
    description: 'Away from keyboard'
  },
  { 
    id: 'lunch', 
    icon: FaPizzaSlice, 
    label: 'Lunch Break', 
    color: '#f97316',
    description: 'Having lunch'
  },
  { 
    id: 'overtime', 
    icon: FaClock, 
    label: 'Working Late', 
    color: '#6366f1',
    description: 'Working overtime'
  }
];

export const durationOptions = [
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 60, label: '1h' },
  { value: 120, label: '2h' },
  { value: 240, label: '4h' },
  { value: 480, label: '8h' }
];

export const stateCategories = [
  { 
    id: 'work', 
    label: 'Work', 
    icon: MdWork, 
    states: workStates,
    description: 'Current work activity'
  },
  { 
    id: 'mood', 
    label: 'Mood', 
    icon: MdMood, 
    states: moodStates,
    description: 'Current mood or energy level'
  },
  { 
    id: 'availability', 
    label: 'Status', 
    icon: MdNotifications, 
    states: availabilityStates,
    description: 'Availability for communication'
  }
];

export const getStateById = (category, stateId) => {
  const categoryData = stateCategories.find(cat => cat.id === category);
  return categoryData?.states.find(state => state.id === stateId);
};

export const getAllStates = () => {
  return stateCategories.reduce((acc, category) => {
    acc[category.id] = category.states;
    return acc;
  }, {});
};