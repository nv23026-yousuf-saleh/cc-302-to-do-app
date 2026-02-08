#!/bin/bash

VERSION=$1
IMAGE_NAME="yousufalaali/todo-app"

if [ -z "$VERSION" ]; then
    echo "Usage: ./update-docker.sh VERSION"
    echo "Example: ./update-docker.sh v1.0.1"
    exit 1
fi

echo "Building version $VERSION..."
docker build -t $IMAGE_NAME:$VERSION -t $IMAGE_NAME:latest .

echo "Testing locally..."
docker run -d -p 5000:5000 --name test $IMAGE_NAME:$VERSION

echo "Test at http://localhost:5000"
echo "Press Enter to push, or Ctrl+C to cancel..."
read

docker stop test && docker rm test

echo "Pushing to Docker Hub..."
docker push $IMAGE_NAME:$VERSION
docker push $IMAGE_NAME:latest

echo "Done! Version $VERSION is now live."
