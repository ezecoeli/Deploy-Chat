import { 
  FaCode, FaWrench, FaEye, FaFlask, FaRocket, FaBook, 
  FaFileAlt, FaBullseye, FaFire, FaCrosshairs, FaCoffee,
  FaBed, FaBrain, FaCircle, FaPizzaSlice, FaClock, 
} from 'react-icons/fa';
import { 
  MdWork, MdMood, MdNotifications, MdDoNotDisturb, MdDirectionsWalk 
} from 'react-icons/md';
import { LuPartyPopper } from "react-icons/lu";

export const allStates = [
  { 
    id: 'available', 
    icon: FaCircle, 
    labelKey: 'available',
    color: '#22c55e'
  },
  { 
    id: 'busy', 
    icon: MdDoNotDisturb, 
    labelKey: 'busy',
    color: '#ef4444'
  },
  { 
    id: 'away', 
    icon: MdDirectionsWalk, 
    labelKey: 'away',
    color: '#eab308'
  },
  { 
    id: 'lunch', 
    icon: FaPizzaSlice, 
    labelKey: 'lunch',
    color: '#f97316'
  },
  { 
    id: 'overtime', 
    icon: FaClock, 
    labelKey: 'overtime',
    color: '#6366f1'
  },
  { 
    id: 'coding', 
    icon: FaCode, 
    labelKey: 'coding',
    color: '#10b981'
  },
  { 
    id: 'debugging', 
    icon: FaWrench, 
    labelKey: 'debugging',
    color: '#f59e0b'
  },
  { 
    id: 'reviewing', 
    icon: FaEye, 
    labelKey: 'reviewing',
    color: '#3b82f6'
  },
  { 
    id: 'testing', 
    icon: FaFlask, 
    labelKey: 'testing',
    color: '#8b5cf6'
  },
  { 
    id: 'deploying', 
    icon: FaRocket, 
    labelKey: 'deploying',
    color: '#ef4444'
  },
  { 
    id: 'learning', 
    icon: FaBook, 
    labelKey: 'learning',
    color: '#06b6d4'
  },
  { 
    id: 'documenting', 
    icon: FaFileAlt, 
    labelKey: 'documenting',
    color: '#84cc16'
  },
  { 
    id: 'meeting', 
    icon: FaBullseye, 
    labelKey: 'meeting',
    color: '#f97316'
  },
  { 
    id: 'fire', 
    icon: FaFire, 
    labelKey: 'fire',
    color: '#dc2626'
  },
  { 
    id: 'focused', 
    icon: FaCrosshairs, 
    labelKey: 'focused',
    color: '#7c3aed'
  },
  { 
    id: 'coffee', 
    icon: FaCoffee, 
    labelKey: 'coffee',
    color: '#92400e'
  },
  { 
    id: 'tired', 
    icon: FaBed, 
    labelKey: 'tired',
    color: '#6b7280'
  },
  { 
    id: 'thinking', 
    icon: FaBrain, 
    labelKey: 'thinking',
    color: '#059669'
  },
  { 
    id: 'celebrate', 
    icon: LuPartyPopper, 
    labelKey: 'celebrate',
    color: '#db2777'
  }
];

export const workStates = [
  { 
    id: 'coding', 
    icon: FaCode, 
    labelKey: 'coding',
    color: '#10b981'
  },
  { 
    id: 'debugging', 
    icon: FaWrench, 
    labelKey: 'debugging',
    color: '#f59e0b'
  },
  { 
    id: 'reviewing', 
    icon: FaEye, 
    labelKey: 'reviewing',
    color: '#3b82f6'
  },
  { 
    id: 'testing', 
    icon: FaFlask, 
    labelKey: 'testing',
    color: '#8b5cf6'
  },
  { 
    id: 'deploying', 
    icon: FaRocket, 
    labelKey: 'deploying',
    color: '#ef4444'
  },
  { 
    id: 'learning', 
    icon: FaBook, 
    labelKey: 'learning',
    color: '#06b6d4'
  },
  { 
    id: 'documenting', 
    icon: FaFileAlt, 
    labelKey: 'documenting',
    color: '#84cc16'
  },
  { 
    id: 'meeting', 
    icon: FaBullseye, 
    labelKey: 'meeting',
    color: '#f97316'
  }
];

export const moodStates = [
  { 
    id: 'fire', 
    icon: FaFire, 
    labelKey: 'fire',
    color: '#dc2626'
  },
  { 
    id: 'focused', 
    icon: FaCrosshairs, 
    labelKey: 'focused',
    color: '#7c3aed'
  },
  { 
    id: 'coffee', 
    icon: FaCoffee, 
    labelKey: 'coffee',
    color: '#92400e'
  },
  { 
    id: 'tired', 
    icon: FaBed, 
    labelKey: 'tired',
    color: '#6b7280'
  },
  { 
    id: 'thinking', 
    icon: FaBrain, 
    labelKey: 'thinking',
    color: '#059669'
  },
  { 
    id: 'celebrate', 
    icon: LuPartyPopper, 
    labelKey: 'celebrate',
    color: '#db2777'
  }
];

export const availabilityStates = [
  { 
    id: 'available', 
    icon: FaCircle, 
    labelKey: 'available',
    color: '#22c55e'
  },
  { 
    id: 'busy', 
    icon: MdDoNotDisturb, 
    labelKey: 'busy',
    color: '#ef4444'
  },
  { 
    id: 'away', 
    icon: MdDirectionsWalk, 
    labelKey: 'away',
    color: '#eab308'
  },
  { 
    id: 'lunch', 
    icon: FaPizzaSlice, 
    labelKey: 'lunch',
    color: '#f97316'
  },
  { 
    id: 'overtime', 
    icon: FaClock, 
    labelKey: 'overtime',
    color: '#6366f1'
  }
];

export const stateCategories = [
  { 
    id: 'work', 
    label: 'Work', 
    icon: MdWork, 
    states: workStates
  },
  { 
    id: 'mood', 
    label: 'Mood', 
    icon: MdMood, 
    states: moodStates
  },
  { 
    id: 'availability', 
    label: 'Status', 
    icon: MdNotifications, 
    states: availabilityStates
  },
  {
    id: 'status',
    label: 'Status',
    icon: MdNotifications,
    states: allStates
  }
];

export const getStateById = (category, stateId, t = null) => {
  if (category === 'status') {
    const state = allStates.find(state => state.id === stateId);
    if (!state) return null;
    
    if (t) {
      return {
        ...state,
        label: t(state.labelKey)
      };
    }
    return state;
  }

  const categoryData = stateCategories.find(cat => cat.id === category);
  const state = categoryData?.states.find(state => state.id === stateId);
  
  if (!state) return null;
  
  if (t) {
    return {
      ...state,
      label: t(state.labelKey)
    };
  }
  
  return state;
};

export const getAllStates = () => {
  return stateCategories.reduce((acc, category) => {
    acc[category.id] = category.states;
    return acc;
  }, {});
};