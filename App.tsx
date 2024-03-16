import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TextInput, Button, StyleSheet, TouchableOpacity, Modal, AsyncStorage } from 'react-native';

const App = () => {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [favoriteModalVisible, setFavoriteModalVisible] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [likedBooks, setLikedBooks] = useState([]);

  useEffect(() => {
    fetchBooks();
    loadFavorites();
    loadLikedBooks();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      fetchBooks();
    } else {
      const filteredBooks = books.filter(book => book.title.toLowerCase().includes(searchTerm.toLowerCase()));
      setBooks(filteredBooks);
    }
  }, [searchTerm]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://openlibrary.org/subjects/sci-fi.json?details=true');
      const bookData = await response.json();
      const fetchedBooks = bookData.works.map((work: any) => ({
        key: work.key,
        title: work.title,
        authors: work.authors.map((author: any) => author.name),
        coverUrl: `https://covers.openlibrary.org/b/id/${work.cover_id}-L.jpg`,
        genre: bookData.name,
        publicationYear: work.first_publish_year,
        description: work.description?.value || 'No description available',
        liked: false, // New property to track liked status
        reviews: [], // Array to store reviews
      }));
      setBooks(fetchedBooks);
    } catch (error) {
      console.error('Error fetching books:', error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const openBookDetails = (book) => {
    setSelectedBook(book);
    setModalVisible(true);
  };

  const addToFavorites = async (book) => {
    try {
      const newFavorites = [...favorites, book];
      setFavorites(newFavorites);
      await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  };

  const removeFromFavorites = async (book) => {
    try {
      const newFavorites = favorites.filter((item) => item.key !== book.key);
      setFavorites(newFavorites);
      await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  const loadFavorites = async () => {
    const storedFavorites = await AsyncStorage.getItem('favorites');
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  };

  const toggleLike = (book) => {
    const updatedBooks = books.map((b) => {
      if (b.key === book.key) {
        return { ...b, liked: !b.liked };
      }
      return b;
    });
    setBooks(updatedBooks);
    if (book.liked) {
      addToLikedBooks(book);
    } else {
      removeFromLikedBooks(book);
    }
  };

  const addToLikedBooks = async (book) => {
    try {
      const newLikedBooks = [...likedBooks, book];
      setLikedBooks(newLikedBooks);
      await AsyncStorage.setItem('likedBooks', JSON.stringify(newLikedBooks));
    } catch (error) {
      console.error('Error adding to liked books:', error);
    }
  };

  const removeFromLikedBooks = async (book) => {
    try {
      const newLikedBooks = likedBooks.filter((b) => b.key !== book.key);
      setLikedBooks(newLikedBooks);
      await AsyncStorage.setItem('likedBooks', JSON.stringify(newLikedBooks));
    } catch (error) {
      console.error('Error removing from liked books:', error);
    }
  };

  const loadLikedBooks = async () => {
    const storedLikedBooks = await AsyncStorage.getItem('likedBooks');
    if (storedLikedBooks) {
      setLikedBooks(JSON.parse(storedLikedBooks));
    }
  };

  const addReview = () => {
    const updatedBooks = books.map((book) => {
      if (book.key === selectedBook.key) {
        return { ...book, reviews: [...book.reviews, reviewText] };
      }
      return book;
    });
    setBooks(updatedBooks);
    setReviewText('');
  };

  const renderFavoriteButton = (book) => {
    if (favorites.some((fav) => fav.key === book.key)) {
      return (
        <Button title="Remove from Favorites" onPress={() => removeFromFavorites(book)} />
      );
    } else {
      return (
        <Button title="Add to Favorites" onPress={() => addToFavorites(book)} />
      );
    }
  };

  const renderMenuItem = () => (
    <TouchableOpacity onPress={() => setFavoriteModalVisible(true)}>
      <Text style={styles.menuItem}>Favorites</Text>
    </TouchableOpacity>
  );

  const renderFavoritesModal = () => (
    <Modal
      visible={favoriteModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setFavoriteModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Favorite Books</Text>
          <FlatList
            data={favorites}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => openBookDetails(item)}>
                <Text style={styles.favoriteItem}>{item.title}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.key}
          />
          <Button title="Close" onPress={() => setFavoriteModalVisible(false)} />
        </View>
      </View>
    </Modal>
  );

  const renderBookModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {selectedBook && (
            <>
              <Image source={{ uri: selectedBook.coverUrl }} style={styles.modalCoverImage} />
              <Text style={styles.modalTitle}>{selectedBook.title}</Text>
              <Text style={styles.modalAuthors}>By {selectedBook.authors.join(', ')}</Text>
              <Text style={styles.modalGenre}>Genre: {selectedBook.genre}</Text>
              <Text style={styles.modalPublicationYear}>Publication Year: {selectedBook.publicationYear}</Text>
              <Text style={styles.modalDescription}>{selectedBook.description}</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => toggleLike(selectedBook)}>
                  <Text style={styles.likeButton}>{selectedBook.liked ? 'Unlike' : 'Like'}</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.reviewInput}
                  placeholder="Add a review"
                  value={reviewText}
                  onChangeText={(text) => setReviewText(text)}
                />
                <Button title="Add Review" onPress={addReview} />
              </View>
            </>
          )}
          <Button title="Close" onPress={() => setModalVisible(false)} />
        </View>
      </View>
    </Modal>
  );

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => openBookDetails(item)}>
      <View style={styles.itemContainer}>
        <Image source={{ uri: item.coverUrl }} style={styles.coverImage} />
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.authors}>By {item.authors.join(', ')}</Text>
          <Text style={styles.genre}>Genre: {item.genre}</Text>
          <Text style={styles.publicationYear}>Publication Year: {item.publicationYear}</Text>
          <Text style={styles.description}>{item.description}</Text>
          <View style={styles.actionsContainer}>
            {renderFavoriteButton(item)}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topMenu}>
        {renderMenuItem()}
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search by title"
          value={searchTerm}
          onChangeText={(text) => setSearchTerm(text)}
        />
      </View>
      <FlatList
        data={books}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      {renderFavoritesModal()}
      {renderBookModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 10,
  },
  topMenu: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuItem: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'blue',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 3,
  },
  coverImage: {
    width: 100,
    height: 150,
  },
  detailsContainer: {
    padding: 10,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  authors: {
    fontSize: 16,
    marginBottom: 5,
  },
  genre: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 5,
  },
  publicationYear: {
    fontSize: 14,
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
  },
  actionsContainer: {
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxWidth: '80%',
    maxHeight: '80%',
    alignItems: 'center',
  },
  modalCoverImage: {
    width: 200,
    height: 300,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  modalAuthors: {
    fontSize: 18,
    marginBottom: 5,
  },
  modalGenre: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 5,
  },
  modalPublicationYear: {
    fontSize: 16,
    marginBottom: 5,
  },
  modalDescription: {
    fontSize: 16,
  },
  modalActions: {
    marginTop: 10,
    alignItems: 'center',
  },
  likeButton: {
    fontSize: 16,
    marginBottom: 10,
    color: 'blue',
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    width: '100%',
  },
  favoriteItem: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default App;
