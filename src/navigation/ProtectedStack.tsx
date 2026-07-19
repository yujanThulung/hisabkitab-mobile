import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DashboardScreen from '../screens/dashboard/DashboardScreen';


export type ProtectedStackParamList ={
    Dashboard: undefined;
}


const Stack = createNativeStackNavigator<ProtectedStackParamList>();


const ProtectedStack = () => (
    <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name = "Dashboard" component={DashboardScreen}/>
    </Stack.Navigator>
)

export default ProtectedStack;