import { ThemedView } from '@/components/theme/themeView';
import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Deposit = () => {
  const [modalVisible, setModalVisible] = useState(true);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);

  const handleClose = () => {
    setModalVisible(false);
  };

  return (
    <>
      <ThemedView 
      className="flex-1  items-center justify-center"
       style={{
          height: '50%',
        }}
      >
        <TouchableOpacity
          style={styles.openButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.buttonText}>Open Full Screen Modal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.openButton}
          onPress={() => setBottomSheetVisible(true)}
        >
          <Text style={styles.buttonText}>Open Bottom Sheet Modal</Text>
        </TouchableOpacity>
      </ThemedView>

      {/* Full Screen Modal with Custom Backdrop */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        // transparent={true}
        // statusBarTranslucent={true}
        onRequestClose={handleClose}
      >
        {/* Custom Backdrop with opacity and blur effect */}
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.backdropTouchable} onPress={handleClose} />
          
          {/* Modal Content Container */}
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Custom Modal</Text>
              <Text style={styles.modalText}>
                This modal has a custom backdrop with semi-transparent background
              </Text>
              
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Sheet Style Modal */}
      <Modal
        visible={bottomSheetVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBottomSheetVisible(false)}
       
      >
        <View style={styles.bottomSheetBackdrop}>
          <Pressable 
            style={styles.bottomSheetBackdropTouchable} 
            onPress={() => setBottomSheetVisible(false)} 
          />
          
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetHandle} />
            <Text style={styles.bottomSheetTitle}>Bottom Sheet Modal</Text>
            <Text style={styles.bottomSheetText}>
              This is a bottom sheet style modal with custom height
            </Text>
            
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setBottomSheetVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Button styles
  openButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Full Screen Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Semi-transparent backdrop
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: StatusBar.currentHeight || 44, // Handle status bar
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: screenWidth * 0.9, // 90% of screen width
    maxHeight: screenHeight * 0.8, // Maximum 80% of screen height
    backgroundColor: 'white',
    borderRadius: 16,
    elevation: 10, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalContent: {
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
    lineHeight: 24,
  },

  // Bottom Sheet Modal Styles
  bottomSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetBackdropTouchable: {
    flex: 1,
  },
  bottomSheetContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 34, // Safe area bottom padding
    paddingTop: 12,
    minHeight: screenHeight * 0.4, // Minimum 40% of screen height
    maxHeight: screenHeight * 0.9, // Maximum 90% of screen height
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  bottomSheetText: {
    fontSize: 16,
    marginBottom: 24,
    color: '#666',
    lineHeight: 24,
  },

  // Common Button Styles
  closeButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Deposit;