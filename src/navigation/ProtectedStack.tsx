import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProtectedTabs from "./ProtectedTabs";


export type ProtectedStackParamList ={
    Dashboard: undefined;
}


const Stack = createNativeStackNavigator<ProtectedStackParamList>();


const ProtectedStack = () => (
    <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name = "Dashboard" component={ProtectedTabs}/>
    </Stack.Navigator>
)

export default ProtectedStack;