const Book = require('../models/Book');
const fs = require('fs');

exports.getOneBook = (req, res, next) => {
    Book.findOne({
      _id: req.params.id
    }).then(
      (book) => {
        res.status(200).json(book);
      }
    ).catch(
      (error) => {
        res.status(404).json({
          error: error
        });
      }
    );
  };

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);  
  delete bookObject._id;
  delete bookObject._userId;
  
  const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
  });
  
    book.save()
    .then(() => { res.status(201).json({message: 'livre enregistré !'})})
    .catch(error => {
      console.error('Erreur lors de la sauvegarde :', error);
      res.status(400).json({ error });
 });
};

exports.createRateBook = (req, res, next) => {
  const userId = req.auth.userId; // Récupère l'ID de l'utilisateur depuis l'authentification
  const { rating } = req.body; // Récupère la note depuis le corps de la requête

  // Vérifie que la note est un nombre entre 0 et 5
  if (typeof rating !== 'number' || rating < 0 || rating > 5) {
    return res.status(400).json({ message: 'La note doit être comprise entre 0 et 5.' });
  }

  // Recherche du livre par ID
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: 'Livre non trouvé.' });
      }

      // Vérifie si l'utilisateur a déjà noté ce livre
      const hasRated = book.ratings.some((rate) => rate.userId === userId);
      if (hasRated) {
        return res.status(403).json({ message: 'Vous avez déjà noté ce livre.' });
      }

      // Ajoute la nouvelle note au tableau `ratings`
      book.ratings.push({ userId: userId, grade: rating });

      // Calcule la nouvelle note moyenne
      const totalRatings = book.ratings.length;
      const totalGrade = book.ratings.reduce((sum, rate) => sum + rate.grade, 0);
      book.averageRating = Math.round((totalGrade / totalRatings)*10)/10;

      // Enregistre les modifications
      book.save()
        .then((updatedBook) => {
          res.status(200).json(updatedBook); // Renvoie le livre mis à jour en réponse
        })
        .catch((error) => {
          console.error('Erreur lors de la mise à jour de la note :', error);
          res.status(500).json({ error });
        });
    })
    .catch((error) => {
      console.error('Erreur lors de la recherche du livre :', error);
      res.status(500).json({ error });
    });
};

exports.modifyBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book || '{}'), // Gère le corps de la requête s'il existe
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
      }
    : { ...req.body };

  // On s'assure que la note (averageRating) ne soit pas modifiée
  delete bookObject._userId;
  delete bookObject.averageRating;

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: 'Livre non trouvé.' });
      }

      if (book.userId !== req.auth.userId) {
        return res.status(403).json({ message: 'unauthorized request.' });
      }

      if (req.file) {
        // Supprimer l'ancienne image du serveur si une nouvelle image est fournie
        const oldImagePath = book.imageUrl.split('/images/')[1];
        fs.unlink(`images/${oldImagePath}`, (err) => {
          if (err) {
            console.error('Erreur lors de la suppression de l\'ancienne image :', err);
          }
        });
      }

      Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Livre modifié avec succès !' }))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};


    
exports.deleteBook = (req, res, next) => {
  // Trouver le livre par son ID
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: 'Livre non trouvé' });
      }

      // Vérifie si l'utilisateur est autorisé à supprimer le livre
      if (book.userId != req.auth.userId) {
        return res.status(403).json({ message: 'Requête non autorisée' });
      }

      // Extraire le nom de fichier de l'URL de l'image
      const imagePath = book.imageUrl.split('/images/')[1];

      // Supprimer le fichier image du dossier `images`
      fs.unlink(`images/${imagePath}`, (err) => {
        if (err) {
          console.error('Erreur lors de la suppression de l\'image :', err);
          return res.status(500).json({ message: 'Erreur lors de la suppression de l\'image', error: err });
        }

        // Supprimer le livre de la base de données
        Book.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Livre supprimé!' }))
          .catch((error) => {
            console.error('Erreur lors de la suppression du livre:', error);
            res.status(400).json({ error });
          });
      });
    })
    .catch((error) => {
      console.error('Erreur lors de la recherche du livre:', error);
      res.status(500).json({ error });
    });
};
  
 exports.getAllBook = (req, res, next) => {
    Book.find()
    .then(
      (books) => {
        res.status(200).json(books);
      }
    ).catch(
      (error) => {
        res.status(400).json({
          error: error
        });
      }
    );
  };
  
 exports.bestRatingBook = (req, res, next) => {
    Book.find()
    .sort({ averageRating: -1 }) // Trie les livres par `averageRating` de manière décroissante
    .limit(3) // Limite le résultat à 3 livres
    .then((books) => {
      res.status(200).json(books); // Renvoie les livres trouvés
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
  };


  