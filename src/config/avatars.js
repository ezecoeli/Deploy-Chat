
import avatar01 from '../assets/avatars/avatar-01.png';
import avatar02 from '../assets/avatars/avatar-02.png';
import avatar03 from '../assets/avatars/avatar-03.png';
import avatar04 from '../assets/avatars/avatar-04.png';
import avatar05 from '../assets/avatars/avatar-05.png';
import avatar06 from '../assets/avatars/avatar-06.png';
import avatar07 from '../assets/avatars/avatar-07.png';
import avatar08 from '../assets/avatars/avatar-08.png';
import avatar09 from '../assets/avatars/avatar-09.png';
import avatar10 from '../assets/avatars/avatar-10.png';

export const AVATAR_OPTIONS = [
  { id: 'avatar-01', src: avatar01, name: 'Avatar 1' },
  { id: 'avatar-02', src: avatar02, name: 'Avatar 2' },
  { id: 'avatar-03', src: avatar03, name: 'Avatar 3' },
  { id: 'avatar-04', src: avatar04, name: 'Avatar 4' },
  { id: 'avatar-05', src: avatar05, name: 'Avatar 5' },
  { id: 'avatar-06', src: avatar06, name: 'Avatar 6' },
  { id: 'avatar-07', src: avatar07, name: 'Avatar 7' },
  { id: 'avatar-08', src: avatar08, name: 'Avatar 8' },
  { id: 'avatar-09', src: avatar09, name: 'Avatar 9' },
  { id: 'avatar-10', src: avatar10, name: 'Avatar 10' }
];

// helper function to get avatar by id
export const getAvatarById = (id) => {
  return AVATAR_OPTIONS.find(avatar => avatar.id === id);
};

// helper function to get default avatar
export const getDefaultAvatar = () => {
  return AVATAR_OPTIONS[0]; // First avatar as default
};