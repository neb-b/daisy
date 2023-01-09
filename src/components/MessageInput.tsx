import { View } from "react-native"
import {
  Input,
  Button,
  Divider,
  TopNavigation,
  Layout,
  Icon,
  Text,
  TopNavigationAction,
} from "@ui-kitten/components"

export const MessageInput = () => (
  <>
    <Divider />
    <View
      style={{
        display: "flex",
        flexDirection: "row",

        padding: 10,
      }}
    >
      <Input
        style={{ borderRadius: 20, height: 40, flex: 1, marginRight: 8 }}
        placeholder="Send a reply..."
        textStyle={{ flex: 1, fontSize: 18 }}
      />
      <Button
        style={{ height: 40, width: 40, borderRadius: 20 }}
        accessoryLeft={(props) => <Icon {...props} name="paper-plane-outline" />}
      />
    </View>
  </>
)
