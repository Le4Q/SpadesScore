import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  AsyncStorage,
  ToastAndroid,
  FlatList,
} from 'react-native';
import { Linking } from 'expo';
import colors from '../constants/Colors';
import { useNavigation } from '@react-navigation/native';
import { ScreenNameList } from '../constants/ParamList';
import { StackNavigationProp } from '@react-navigation/stack';
import CustomListItem from '../components/CustomListItem';
import AddSaveStateContainer from '../components/AddSaveStateContainer';
import GameData from '../stateContainers/GameData';
import InputModal from '../components/InputModal';
import AlertModal from '../components/AlertModal';

let pkg = require('../../app.json');

interface SettingsProps {}

const Settings: React.FC<SettingsProps> = () => {
  const navigation: StackNavigationProp<
    ScreenNameList,
    'Settings'
  > = useNavigation();

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [newGameModalVisible, setNewGameModalVisible] = useState<boolean>(
    false
  );
  const gameData = GameData.useContainer();

  const onPressNewGame = () => {
    gameData.resetGame();
    AsyncStorage.removeItem('lastGameState');
    setNewGameModalVisible(false);
    ToastAndroid.show('Game was reset.', ToastAndroid.SHORT);
  };

  const settingsList = [
    {
      title: 'New Game',
      subtitle: 'Create a new game',
      icon: {
        name: 'autorenew',
        type: 'material-community',
      },
      onPress: () => setNewGameModalVisible(true),
    },
    {
      title: 'Save Game',
      subtitle: 'Create a new save state',
      icon: {
        name: 'content-save',
        type: 'material-community',
      },
      onPress: () => setModalVisible(true),
    },
    {
      title: 'Save States',
      subtitle: 'Manage and load save states',
      icon: {
        name: 'storage',
        type: 'material',
      },
      onPress: () => navigation.navigate('SaveStates'),
    },
    // TODO: implement thresholds and alert when one team wins
    /*     {
      title: 'Set point thresholds',
      subtitle:
        'Set the number of points a team has to reach to win or below which they lose',
      icon: {
        name: 'tune',
        type: 'material-community',
      },
      onPress: () => {},
    }, */
    {
      title: 'Rate App',
      subtitle: 'If you like the app, plese consider leaving a review.',
      icon: {
        name: 'star',
        type: 'material-community',
      },
      onPress: () => Linking.openURL('market://details?id=com.leku.spades'),
    },
    {
      title: 'Version',
      icon: {
        name: 'versions',
        type: 'octicon',
        containerStyle: { paddingLeft: 5 },
      },
      rightTitle: pkg.expo.version,
    },
  ];

  return (
    <View style={styles.container}>
      <AlertModal
        visible={newGameModalVisible}
        text='Current game will be lost if unsaved.'
        buttons={[
          { title: 'Cancel', onPress: () => setNewGameModalVisible(false) },
          {
            title: 'OK',
            onPress: () => onPressNewGame(),
          },
        ]}
      />
      <AddSaveStateContainer
        render={(addSaveState) => (
          <InputModal
            label='Enter a name for the save state.'
            placeHolder={getDate()}
            visible={modalVisible}
            onCancelPress={() => setModalVisible(!modalVisible)}
            onOKPress={(input) => {
              addSaveState(input);
              setModalVisible(!modalVisible);
            }}
          />
        )}
      />
      <FlatList
        data={settingsList}
        keyExtractor={(item, idx) => `settingsItem${idx}`}
        renderItem={({ item }) => (
          <CustomListItem
            key={item.title}
            title={item.title}
            subtitle={item.subtitle}
            icon={item.icon}
            onPress={item.onPress}
            leftPadding
            rightTitle={item.rightTitle}
            rightTitleStyle={{ color: '#ddd' }}
          />
        )}
      />
    </View>
  );
};
const getDate = () => {
  let date = new Date();
  return `${date.getFullYear()}/${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
};

export default Settings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backDropColor,
  },
});
