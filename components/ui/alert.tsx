import { Alert } from "react-native";



export const AlertComponent = ({title, message, btnTxt, btnFunc}: any) => {
    return Alert.alert(
        title,
        message,
         [
            {
                text: btnTxt,
                onPress: btnFunc,
            }
        ] 
    );
}