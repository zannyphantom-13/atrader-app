

import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View
} from 'react-native';



// Request permissions (automatically handled by expo-image-picker in newer versions)
export  const requestPermissions = async () => {
    if (Platform.OS === 'ios') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!');
        return false;
      }
    }
    return true;
  };









const ImagePickerComponent = () => {
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [imageUri, setImageUri] = useState('');

  

  // Pick image from gallery/library
  const pickImageFromGallery = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        // For web compatibility
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageAsset = result.assets[0];
        setSelectedImage(imageAsset);
        setImageUri(imageAsset.uri);
        // console.log('Selected image:', imageAsset);
      }
    } catch (error) {
      // console.log('Error picking image from gallery:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  // Pick image from camera
  const pickImageFromCamera = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageAsset = result.assets[0];
        setSelectedImage(imageAsset);
        setImageUri(imageAsset.uri);
        // console.log('Captured image:', imageAsset);
      }
    } catch (error) {
      // console.log('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Show action sheet to choose between camera and gallery
  const showImagePickerOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: pickImageFromCamera,
        },
        {
          text: 'Gallery',
          onPress: pickImageFromGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  // For web-specific file input (alternative approach)
  const pickImageWeb = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (event: any) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            setImageUri(e.target.result);
            // setSelectedImage({
            // //   uri: e.target.result,
            //   name: file.name,
            //   type: file.type,
            //   size: file.size,
            // });
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      pickImageFromGallery();
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: 20, marginBottom: 20 }}>Image Picker Example</Text>
      
      {/* Display selected image */}
   {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={{ width: 200, height: 200, marginBottom: 20, borderRadius: 10 }}
          resizeMode="cover"
        />
      )}

       {/* Buttons */}
       <TouchableOpacity
        onPress={pickImageFromGallery}
        style={{
          backgroundColor: '#007AFF',
          padding: 15,
          borderRadius: 10,
          marginBottom: 10,
          minWidth: 200,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Pick from Gallery</Text>
      </TouchableOpacity>

      {Platform.OS !== 'web' && (
        <TouchableOpacity
          onPress={pickImageFromCamera}
          style={{
            backgroundColor: '#34C759',
            padding: 15,
            borderRadius: 10,
            marginBottom: 10,
            minWidth: 200,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Take Photo</Text>
        </TouchableOpacity>
      )}

    
      <TouchableOpacity
        onPress={showImagePickerOptions}
        style={{
          backgroundColor: '#FF9500',
          padding: 15,
          borderRadius: 10,
          marginBottom: 10,
          minWidth: 200,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Choose Option</Text>
      </TouchableOpacity>

      {Platform.OS === 'web' && (
        <TouchableOpacity
          onPress={pickImageWeb}
          style={{
            backgroundColor: '#8E8E93',
            padding: 15,
            borderRadius: 10,
            marginBottom: 10,
            minWidth: 200,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Web File Input</Text>
        </TouchableOpacity>
      )}

      {/* Display image information */}
      {selectedImage && (
        <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 5 }}>
          <Text>Image Info:</Text>
          {/* <Text>Width: {selectedImage.width || 'N/A'}</Text>
          <Text>Height: {selectedImage.height || 'N/A'}</Text>
          <Text>Size: {selectedImage.fileSize ? `${(selectedImage.fileSize / 1024 / 1024).toFixed(2)} MB` : 'N/A'}</Text>
          <Text>Type: {selectedImage.type || 'N/A'}</Text> */}
        </View>
      )}
    </View>
  );
};

export default ImagePickerComponent;

// ==========================================
// ADDITIONAL CONFIGURATIONS AND EXAMPLES
// ==========================================

// Advanced Image Picker with more options
const AdvancedImagePicker = () => {
  const [images, setImages] = useState<any>([]);

  const pickMultipleImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true, // Enable multiple selection
        selectionLimit: 5, // Limit to 5 images
        exif: false, // Include EXIF data
      });

      if (!result.canceled && result.assets) {
        setImages(result.assets || []);
        // console.log('Selected images:', result.assets);
      }
    } catch (error) {
      // console.log('Error picking multiple images:', error);
    }
  };

  const pickImageWithCrop = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square crop
        quality: 1,
        base64: true, // Include base64 encoded string
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageAsset = result.assets[0];
        // console.log('Base64 string available:', !!imageAsset.base64);
        // You can use imageAsset.base64 for uploading to servers
      }
    } catch (error) {
      // console.log('Error picking image with crop:', error);
    }
  };
    
  return (
    <View>
      {/* Your advanced picker UI here */}
    </View>
  );
};




const useImagePicker = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async (source = 'gallery') => {
    try {
      setIsLoading(true);
      
      let result;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Camera permission is needed');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 1,
        });
      } else {
        if (Platform.OS === 'ios') {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission required', 'Gallery permission is needed');
            return;
          }
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 1,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0] as any);
        return result.assets[0];
      }
    } catch (error) {
      // console.log('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setIsLoading(false);
    }
  };

  const resetImage = () => {
    setSelectedImage(null);
  };

  return {
    selectedImage,
    isLoading,
    pickImage,
    resetImage,
  };
};