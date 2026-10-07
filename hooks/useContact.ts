// hooks/useContacts.ts
import { useState, useEffect, useCallback } from 'react';
import * as Contacts from 'expo-contacts';
import { Alert, Platform } from 'react-native';

// Types for contact data
export interface ContactPhone {
  contactName: string;
  phoneNumber: string;
  label: string;
  contactId?: string;
}

export interface ContactData {
  id: string;
  name: string;
  phoneNumber: string;
  label: string;
}

export interface ContactsHookReturn {
  hasPermission: boolean;
  loading: boolean;
  contacts: Contacts.Contact[];
  checkPermission: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  getContactsWithPhones: () => Promise<Contacts.Contact[]>;
  searchContactsByName: (searchTerm: string) => Promise<Contacts.Contact[]>;
  pickContactPhone: () => Promise<ContactPhone | null>;
}

export interface ContactPhoneSelectorReturn {
  selectedContact: ContactPhone | null;
  phoneNumber: string;
  loading: boolean;
  selectContactPhone: () => Promise<string | null>;
  clearSelection: () => void;
  setPhoneNumber: (phone: string) => void;
}

// Core contacts hook
export const useContacts = (): ContactsHookReturn => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);


  // Check permission status
  const checkPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Contacts.getPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      return granted;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }, []);


  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      const { status } = await Contacts.requestPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      return granted;
    } catch (error) {
      console.error('Permission request error:', error);
      Alert.alert('Error', 'Failed to request contacts permission');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);


  // Get all contacts with phone numbers
  const getContactsWithPhones = useCallback(async (): Promise<Contacts.Contact[]> => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return [];
    }

    try {
      setLoading(true);
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
        ],
        sort: Contacts.SortTypes.FirstName,
      });

      // Filter contacts that have phone numbers
      const contactsWithPhones = data.filter(
        (contact): contact is Contacts.Contact => 
          contact.phoneNumbers !== undefined && contact.phoneNumbers.length > 0
      );

      setContacts(contactsWithPhones);
      return contactsWithPhones;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      Alert.alert('Error', 'Failed to fetch contacts');
      return [];
    } finally {
      setLoading(false);
    }
  }, [hasPermission, requestPermission]);


  // Search contacts by name
  const searchContactsByName = useCallback(async (searchTerm: string): Promise<Contacts.Contact[]> => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return [];
    }

    if (!searchTerm || searchTerm.length < 2) {
      setContacts([]);
      return [];
    }

    try {
      setLoading(true);
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
        ],
        name: searchTerm,
        sort: Contacts.SortTypes.FirstName,
      });

      const contactsWithPhones = data.filter(
        (contact): contact is Contacts.Contact => 
          contact.phoneNumbers !== undefined && contact.phoneNumbers.length > 0
      );

      setContacts(contactsWithPhones);
      return contactsWithPhones;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [hasPermission, requestPermission]);


  // Present native contact picker and return phone number
  const pickContactPhone = useCallback(async (): Promise<ContactPhone | null> => {
    try {
      // Android requires permission, iOS doesn't for contact picker
      if (Platform.OS === 'android' && !hasPermission) {
        const granted = await requestPermission();
        if (!granted) return null;
      }

      const contact = await Contacts.presentContactPickerAsync();
      
      if (contact && contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        // Return the first phone number
        return {
          contactName: contact.name,
          phoneNumber: contact.phoneNumbers[0].number || '',
          label: contact.phoneNumbers[0].label || 'mobile',
          contactId: contact.id,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Contact picker error:', error);
      Alert.alert('Error', 'Failed to pick contact');
      return null;
    }
  }, [hasPermission, requestPermission]);

  // Initialize permission check on mount
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    hasPermission,
    loading,
    contacts,
    checkPermission,
    requestPermission,
    getContactsWithPhones,
    searchContactsByName,
    pickContactPhone,
  };
};



// Custom hook specifically for phone number selection
export const useContactPhoneSelector = (): ContactPhoneSelectorReturn => {
  const [selectedContact, setSelectedContact] = useState<ContactPhone | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const { pickContactPhone, loading } = useContacts();

  const selectContactPhone = useCallback(async (): Promise<string | null> => {
    const contactData = await pickContactPhone();
    if (contactData) {
      setSelectedContact(contactData);
      setPhoneNumber(contactData.phoneNumber);
      return contactData.phoneNumber;
    }
    return null;
  }, [pickContactPhone]);

  const clearSelection = useCallback((): void => {
    setSelectedContact(null);
    setPhoneNumber('');
  }, []);

  return {
    selectedContact,
    phoneNumber,
    loading,
    selectContactPhone,
    clearSelection,
    setPhoneNumber,
  };
};



    // Advanced Contact Search Input Component
// interface ContactSearchInputProps extends Omit<InputProps, 'value' | 'onChangeText'> {
//   onContactSelect?: (contact: ContactData) => void;
//   showPhoneNumbers?: boolean;
//   maxResults?: number;
// }

// export const ContactSearchInput: React.FC<ContactSearchInputProps> = ({
//   label = "Search Contacts",
//   placeholder = "Type to search contacts...",
//   onContactSelect,
//   showPhoneNumbers = true,
//   maxResults = 10,
//   className = '',
//   containerClassName = '',
//   ...inputProps
// }) => {
//   const [searchTerm, setSearchTerm] = useState<string>('');
//   const [showResults, setShowResults] = useState<boolean>(false);
//   const { contacts, loading, searchContactsByName } = useContacts();

//   // Handle search input changes
//   const handleSearchChange = async (text: string): Promise<void> => {
//     setSearchTerm(text);
    
//     if (text.length >= 2) {
//       await searchContactsByName(text);
//       setShowResults(true);
//     } else {
//       setShowResults(false);
//     }
//   };

//   // Handle contact selection from search results
//   const handleContactSelect = (contact: Contacts.Contact): void => {
//     const phoneNumber = contact.phoneNumbers?.[0]?.number || '';
//     const contactData: ContactData = {
//       id: contact.id,
//       name: contact.name,
//       phoneNumber,
//       label: contact.phoneNumbers?.[0]?.label || 'mobile',
//     };
    
//     setSearchTerm(`${contact.name}${phoneNumber ? ` (${phoneNumber})` : ''}`);
//     setShowResults(false);
//     onContactSelect?.(contactData);
//   };

//   // Handle clear search
//   const handleClear = (): void => {
//     setSearchTerm('');
//     setShowResults(false);
//   };

//   return (
//     <View className={`relative ${containerClassName}`}>
//       <Input
//         label={label}
//         placeholder={placeholder}
//         value={searchTerm}
//         onChangeText={handleSearchChange}
        
//         // Search icon
//         leadingIcon="search"
        
//         // Clear search
//         trailingIcon={searchTerm ? "close" : undefined}
//         onTrailingIconPress={searchTerm ? handleClear : undefined}
//         showTrailingIcon={!!searchTerm}
        
//         className={className}
//         {...inputProps}
//       />
      
//       {loading && (
//         <Text className="mt-1 text-sm text-blue-600">
//           Searching contacts...
//         </Text>
//       )}
      
//       {/* Search Results Dropdown */}
//       {showResults && contacts.length > 0 && (
//         <View className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg mt-1 max-h-60 z-50">
//           <ScrollView>
//             {contacts.slice(0, maxResults).map((contact) => (
//               <TouchableOpacity
//                 key={contact.id}
//                 onPress={() => handleContactSelect(contact)}
//                 className="p-3 border-b border-gray-100 dark:border-gray-700"
//               >
//                 <Text className="font-medium text-gray-900 dark:text-white">
//                   {contact.name}
//                 </Text>
//                 {showPhoneNumbers && contact.phoneNumbers?.[0] && (
//                   <Text className="text-sm text-gray-600 dark:text-gray-400">
//                     {contact.phoneNumbers[0].number} ({contact.phoneNumbers[0].label})
//                   </Text>
//                 )}
//               </TouchableOpacity>
//             ))}
//           </ScrollView>
//         </View>
//       )}
      
//       {showResults && contacts.length === 0 && !loading && (
//         <View className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg mt-1 p-3 z-50">
//           <Text className="text-gray-600 dark:text-gray-400 text-center">
//             No contacts found
//           </Text>
//         </View>
//       )}
//     </View>
//   );
// };




// Type-safe usage examples:

// Example 1: Simple phone input with contact picker
// interface MyFormData {
//   phoneNumber: string;
// }
 
// const MyForm: React.FC = () => {
//   const [formData, setFormData] = useState<MyFormData>({
//     phoneNumber: '',
//   });
//   
//   const handlePhoneChange = (phone: string): void => {
//     setFormData(prev => ({ ...prev, phoneNumber: phone }));
//   };
//   
//   return (
//     <PhoneInput
//       value={formData.phoneNumber}
//       onChangeText={handlePhoneChange}
//       placeholder="Select or enter phone number"
//     />
//   );
// };

// Example 2: Contact search with selection
// interface ContactSelectorProps {
//   onContactSelected: (contact: ContactData) => void;
// }
// 
// const ContactSelector: React.FC<ContactSelectorProps> = ({ onContactSelected }) => {
//   const handleContactSelect = (contactData: ContactData): void => {
//     onContactSelected(contactData);
//     console.log('Selected:', contactData);
//   };
//   
//   return (
//     <ContactSearchInput
//       onContactSelect={handleContactSelect}
//       placeholder="Search for a contact..."
//     />
//   );
// };

// Example 3: Manual usage with custom hook
// const CustomComponent: React.FC = () => {
//   const [phone, setPhone] = useState<string>('');
//   const { pickContactPhone, loading } = useContactPhoneSelector();
//   
//   const handleSelectContact = async (): Promise<void> => {
//     const phoneNumber = await pickContactPhone();
//     if (phoneNumber) {
//       setPhone(phoneNumber);
//     }
//   };
//   
//   return (
//     <View>
//       <Input
//         value={phone}
//         onChangeText={setPhone}
//         trailingIcon="person-add"
//         onTrailingIconPress={handleSelectContact}
//         placeholder="Phone number"
//         disabled={loading}
//       />
//     </View>
//   );
// };

// Export types for use in other components
// export type { ContactPhone, ContactData, ContactsHookReturn, ContactPhoneSelectorReturn };