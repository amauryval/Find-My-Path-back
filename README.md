docker build -t find_my_path . && docker run -p 5000:5000 find_my_path:latest





## deploy docker on heroku
heroku container:login
heroku create your_app
heroku container:push web --app test-animated-path
heroku container:release web --app test-animated-path