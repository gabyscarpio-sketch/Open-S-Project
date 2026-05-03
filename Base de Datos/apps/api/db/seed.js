import contactRepository from '../features/contact/contact.repository.js';
import userRepository from '../features/user/user.repository.js';

export const usersMock = [
  {
    email: 'alice@example.com',
    passwordHash: 'hash_abc_123',
  },
  {
    email: 'bob@example.com',
    passwordHash: 'hash_abc_456',
  },
];

const seedDatabase = async () => {
  // 1. Insert Mock Users
  const user1 = await userRepository.createUser({
    email: usersMock[0].email,
    passwordHash: usersMock[0].passwordHash,
  });

  const user2 = await userRepository.createUser({
    email: usersMock[1].email,
    passwordHash: usersMock[1].passwordHash,
  });

  console.log('Users seeded!');

  // 2. Insert Mock Contacts
  contactRepository.createContact({
    name: 'Alejandro Perez',
    phone: '04122110101',
    userId: user1.id,
  });

  contactRepository.createContact({
    name: 'Pedro Perez',
    phone: '04141112288',
    userId: user1.id,
  });

  contactRepository.createContact({
    name: 'Pedro Gonzalo',
    phone: '04141112288',
    userId: user2.id,
  });

  console.log('Contacts seeded!');
};

export default seedDatabase;
