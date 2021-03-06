import React, { ReactText, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TouchableNativeFeedback,
} from 'react-native';
import { Icon, Button } from 'react-native-elements';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import GameData from '../stateContainers/GameData';
import { ScreenNameList } from '../constants/ParamList';
import colors from '../constants/Colors';
import Cell from '../components/Cell';
import AlertModal from '../components/AlertModal';

const ScoreBoard: React.FC = (props) => {
  const [editModeEnabled, setEditModeEnabled] = useState<boolean>(false);
  const [deleteWarningModalVisible, setDeleteWarningModalVisible] = useState<
    boolean
  >(false);

  let gameData = GameData.useContainer();

  const [selectedRows, setSelectedRows] = useState<boolean[]>(
    Array(gameData.score.length).fill(false)
  );

  const navigation: StackNavigationProp<
    ScreenNameList,
    'ScoreBoard'
  > = useNavigation();

  navigation.setOptions({
    headerRight: () =>
      !editModeEnabled ? (
        <Icon
          name='edit'
          type='feather'
          size={30}
          color='white'
          onPress={() => setEditModeEnabled(!editModeEnabled)}
          containerStyle={{ marginRight: 12 }}
          underlayColor={'rgba(255, 255, 255, 0.2)'}
        />
      ) : (
        <Button
          title='Done'
          type='clear'
          onPress={() => {
            setEditModeEnabled(!editModeEnabled);
            setSelectedRows(Array(gameData.score.length).fill(false));
          }}
          titleStyle={{ color: 'white' }}
          containerStyle={{ marginRight: 12 }}
        />
      ),
  });

  // configure order of Player collumns here, (0,3) and (1,2) are team
  const order: number[] = [0, 3, 1, 2];

  const Header = () => {
    return (
      <View style={[styles.rowContainer, styles.headerRowContainer]}>
        <View style={styles.roundNumberCell}>
          <Text style={styles.cellText}>#</Text>
        </View>
        {order.map((y) => (
          <Cell
            key={`headerCell${y}`}
            content={gameData.names[y].substr(0, 8)}
            teamNo={team(y)}
          />
        ))}
        {[1, 2].map((n) => (
          <Cell
            key={`hedaerCell$${3 + n}`}
            content={`T${n} Points`}
            teamNo={n}
            separator={n === 1}
          />
        ))}
      </View>
    );
  };

  const Row: React.FC<{
    row: ReactText[]; //string | number[];
    idx: number;
    selected?: boolean;
  }> = (props) => {
    return (
      <TouchableWithoutFeedback
        disabled={!editModeEnabled}
        onPress={() => handleRowPress(props.idx)}
        //activeOpacity={0.5}
      >
        <View key={`${props.idx}`} style={styles.rowContainer}>
          <View style={styles.roundNumberCell}>
            <Text style={styles.cellText}>{props.idx + 1}</Text>
          </View>

          {order.map((y) => (
            <Cell
              key={`cell${props.idx}${y}`}
              content={props.row[2 * y] + '/' + props.row[2 * y + 1]}
              teamNo={team(y)}
            />
          ))}
          <Cell content={props.row[8]} teamNo={1} separator />
          <Cell content={props.row[9]} teamNo={2} />
          <BlurView
            tint='dark'
            intensity={props.selected ? 60 : 0}
            style={[
              StyleSheet.absoluteFill,
              { borderWidth: props.selected ? 1 : 0 },
            ]}
          />
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const getTotalScore: (teamNo: 1 | 2) => number = (teamNo) => {
    let result = gameData.score.reduce((acc, curr) => {
      let res = acc;
      if ((acc % 10) + ((curr[8 + (teamNo - 1)] as number) % 10) >= 10)
        res -= 100;
      return res + (curr[8 + (teamNo - 1)] as number);
    }, 0);
    return result;
  };

  const handleRowPress: (idx: number) => void = (idx) => {
    console.log('Pressed row ' + idx);

    if (selectedRows[idx] === false) {
      let copy = [...selectedRows];
      copy.splice(idx, 1, true);
      console.log(JSON.stringify(copy.map((x, idx) => idx + 1 + ': ' + x)));
      setSelectedRows(copy);
    } else {
      let copy = [...selectedRows];
      copy.splice(idx, 1, false);
      console.log(JSON.stringify(copy.map((x, idx) => idx + 1 + ': ' + x)));
      setSelectedRows(copy);
    }
  };

  //TODO: implement Edit
  const handleEditPress: (selected: boolean[]) => void = (selected) => {
    // opens a modal with PlayerCards to input scores
  };

  const handleDeletePress: (selected: boolean[]) => void = (selected) => {
    gameData.deleteScoreLines(selected);
    setSelectedRows(Array(gameData.score.length).fill(false));
    setDeleteWarningModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <AlertModal
        text='Delete selected rows(s)?'
        visible={deleteWarningModalVisible}
        buttons={[
          {
            title: 'Cancel',
            onPress: () => setDeleteWarningModalVisible(false),
          },
          { title: 'Delete', onPress: () => handleDeletePress(selectedRows) },
        ]}
      />
      {editModeEnabled && (
        <View style={styles.editModeRowContainer}>
          <Text style={styles.editModeText}> Select rows to delete </Text>
          {selectedRows.includes(true) && (
            <View style={styles.editModeButtons}>
              {/* <Button
                title='Edit'
                type='outline'
                onPress={() => handleEditPress(selectedRows)}
              /> */}
              <Button
                title='Delete'
                type='outline'
                onPress={() => setDeleteWarningModalVisible(true)}
                containerStyle={{ marginLeft: 15, borderColor: 'red' }}
                buttonStyle={{ borderColor: 'red' }}
                titleStyle={{ color: 'red' }}
              />
            </View>
          )}
        </View>
      )}
      <Header />
      <FlatList
        data={gameData.score}
        keyExtractor={(item, idx) => `r${idx}`}
        renderItem={({ item, index }) => (
          <Row
            row={item}
            idx={index}
            selected={editModeEnabled && selectedRows[index]}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyListTextContainer}>
            <Text style={styles.emptyListText}>
              Finish a round to see results here.
            </Text>
          </View>
        }
      />
      <View style={styles.totalContainer}>
        <Cell content={'Total'} teamNo={-1} />
        {[1, 2].map((n: 1 | 2) => (
          <Cell
            key={`totalCell${n}`}
            content={gameData.points[n - 1]}
            teamNo={n}
            separator={false}
          />
        ))}
      </View>
    </View>
  );
};

const team: (i: number) => number = (i) => {
  if (i === 0 || i === 3) return 1;
  else if (i === 1 || i === 2) return 2;
  else return -1;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    backgroundColor: colors.backDropColor,
  },
  headerRowContainer: {
    borderTopWidth: 3,
    borderBottomWidth: 3,
  },
  rowContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: colors.horizontalBorderColor, //colors.backDropColor,
  },
  cellText: {
    color: '#ddd',
  },
  roundNumberCell: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
  },
  totalContainer: {
    alignSelf: 'center',
    width: '60%',
    flexDirection: 'row',
    marginTop: 3,
  },
  editModeRowContainer: {
    paddingHorizontal: 25,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editModeText: {
    textAlign: 'center',
    color: colors.textColor,
    paddingVertical: 10,
    paddingRight: 25,
    fontWeight: 'bold',
    fontSize: 17,
  },
  editModeButtons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  emptyListTextContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30,
  },
  emptyListText: {
    color: '#b5b5b5',
  },
});

export default ScoreBoard;
