import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import afrinexusBanner from '../assets/images/afrinexus-banner.png';
import { auth, db } from '../firebase';

// Import des composants séparés
import TabActions from '../components/dashboardTabs/TabActions';
import TabFeliciter from '../components/dashboardTabs/TabFeliciter';
import TabIncident from '../components/dashboardTabs/TabIncident';
import TabInitier from '../components/dashboardTabs/TabInitier';
import TabProfil from '../components/dashboardTabs/TabProfil';

const DashboardScreen = () => {
  const saveProfilToFirestore = async ({ pseudo, photoURL }) => {
    try {
      const docRef = collection(db, 'users');
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        pseudo,
        photoURL
      }, { merge: true });
      console.log('Profil mis à jour dans Firestore');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil :', error);
    }
  };
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState('profil');
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const scrollRef = useRef(null);
  const [scrollInfo, setScrollInfo] = useState({ width: 0, contentWidth: 0 });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userData = {
          email: user.email,
          uid: user.uid,
          nom: user.displayName || 'Utilisateur',
          photoURL: user.photoURL || null,
          avis: []
        };

        try {
          const avisRef = collection(db, 'avis');
          const q = query(avisRef, where('uid', '==', user.uid));
          const snapshot = await getDocs(q);
          userData.avis = snapshot.docs.map(doc => doc.data());
        } catch (err) {
          console.log('Erreur de récupération des avis :', err);
        }

        setCurrentUser(userData);
      }
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Home');
    } catch (error) {
      console.log('Erreur de déconnexion :', error);
    }
  };

  const handleScroll = (event) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const maxScroll = scrollInfo.contentWidth - scrollInfo.width;
    setShowLeftArrow(scrollX > 10);
    setShowRightArrow(scrollX < maxScroll - 10);
  };

  const renderContent = () => {
    if (!currentUser) {
      return <Text style={{ padding: 16 }}>Chargement du profil...</Text>;
    }

    switch (selectedTab) {
      case 'profil':
        return <TabProfil user={currentUser} onLogout={handleLogout} onSaveProfil={saveProfilToFirestore} />;
      case 'actions':
        return <TabActions />;
      case 'initier':
        return <TabInitier />;
      case 'incident':
        return <TabIncident />;
      case 'feliciter':
        return <TabFeliciter />;
      default:
        return null;
    }
  };

  const tabs = [
    { key: 'profil', label: 'Mon\nprofil', icon: 'person' },
    { key: 'actions', label: 'Actions\nautour de moi', icon: 'map-marker-alt', lib: FontAwesome5 },
    { key: 'initier', label: 'Initier\naction citoyenne', icon: 'lightbulb-outline', lib: MaterialIcons },
    { key: 'incident', label: 'Signaler\nun problème', icon: 'report-problem', lib: MaterialIcons },
    { key: 'feliciter', label: 'Féliciter\ninitiative', icon: 'thumbs-up', lib: FontAwesome5 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabBarWrapper}>
        {showLeftArrow && (
          <View style={[styles.arrowIcon, { left: -10 }]}> 
            <Ionicons name="chevron-back" size={28} color="#999" />
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onLayout={(e) => {
            const layoutWidth = e?.nativeEvent?.layout?.width;
            if (layoutWidth != null) {
              setScrollInfo(prev => ({ ...prev, width: layoutWidth }));
            }
          }}
          onContentSizeChange={(w) => {
            if (typeof w === 'number') {
              setScrollInfo(prev => ({ ...prev, contentWidth: w }));
            }
          }}
          ref={scrollRef}
        >
          {tabs.map((tab) => {
            const Icon = tab.lib || Ionicons;
            const isActive = selectedTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setSelectedTab(tab.key)}
              >
                <Icon
                  name={tab.icon}
                  size={16}
                  color={isActive ? '#fff' : '#007bff'}
                  style={{ marginBottom: 4 }}
                />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {showRightArrow && (
          <View style={[styles.arrowIcon, { right: -10 }]}> 
            <Ionicons name="chevron-forward" size={28} color="#999" />
          </View>
        )}
      </View>

      <ScrollView style={styles.content}>
        {renderContent()}
      </ScrollView>

      <View style={styles.banner}>
        <Image
          source={afrinexusBanner}
          style={styles.bannerImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  tabBarWrapper: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    position: 'relative',
  },
  tabBar: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tabButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 6,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#007bff',
  },
  tabText: {
    fontSize: 14.5,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
    color: '#007bff',
  },
  tabTextActive: {
    color: '#fff',
  },
  arrowIcon: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -14 }],
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  banner: {
    height: 122,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  bannerImage: {
    width: '90%',
    height: '100%',
    resizeMode: 'contain',
    marginHorizontal: '5%'
  },
});
