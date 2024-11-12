const Book = require('../models/Book');

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);  
  delete bookObject._id;
  delete bookObject._userId;

  console.log(bookObject);
  
  const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
  });
  console.log('Creating Book:', book);  
    book.save()
    .then(() => { res.status(201).json({message: 'livre enregistré !'})})
    .catch(error => {
      console.error('Erreur lors de la sauvegarde :', error);
      res.status(400).json({ error });
 });
};
  
  //ajouter la fonction createRateBook //

/* exports.getOneBook = (req, res, next) => {
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
  };*/
  
  exports.modifyBook = (req, res, next) => {
    const book = new Book({
      _id: req.params.id,
      userId: req.body.userId,
      title: req.body.title,
      author: req.body.author,
      imageUrl: req.body.imageUrl,
      year: req.body.year,
      genre: req.body.genre,
      ratings: [
          {
              userId: req.body.userId,
              grade: req.body.grade,
          }
      ]
      averageRating: req.body.averageRating
     
    });
    Book.updateOne({_id: req.params.id}, book).then(
      () => {
        res.status(201).json({
          message: 'Thing updated successfully!'
        });
      }
    ).catch(
      (error) => {
        res.status(400).json({
          error: error
        });
      }
    );
  };
  
  /*exports.deleteBook = (req, res, next) => {
    Book.deleteOne({_id: req.params.id}).then(
      () => {
        res.status(200).json({
          message: 'Deleted!'
        });
      }
    ).catch(
      (error) => {
        res.status(400).json({
          error: error
        });
      }
  
      
    );
  };*/
  
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

  //ajouter la fonction bestRatingBook//
