## Introduction
retrofit-request is a [Retrofit](https://square.github.io/retrofit/ "Retrofit") clone. Its a wrapper of `request` using TypeScript's decorator feature for making cleaner HTTP request.


```javascript
import {HTTP,GET,POST,Body, Ajax, Query,Header,Path} from "retrofit-request"

@HTTP("http://some.api.com")
class MyAPI {
    @GET("/get/something", {timeout: 1000})
    public static async getSomething(@Query("id")id: string){return null;}
}

try {
    //making a GET request to http://some.api.com/get/something?id=123
    let result = await MyAPI.getSomething("123");
} catch(e){}
```
## Install
```
npm i retrofit-request
```
## API Declaration
Annotations on the class methods and its parameters indicate how a request will be handled.

### REQUEST METHOD
Every method must have an HTTP annotation that provides the request method and relative URL. There are two built-in annotations: GET, POST. The relative URL of the resource is specified in the annotation.
```javascript
@GET("users/list")
```
You can also specify query parameters in the URL.
```javascript
@GET("users/list?sort=desc")
```

### URL MANIPULATION
A request URL can be updated dynamically using replacement blocks and parameters on the method. A replacement block is an alphanumeric string surrounded by { and }. A corresponding parameter must be annotated with @Path using the same string.
```javascript
@GET("group/{id}/users")
public async groupList(@Path("id")groupId: string): Promise<any> {return null;}
```
Query parameters can also be added.
```javascript
@GET("group/{id}/users")
public async groupList(@Path("id")groupId: string, @Query("sort")sort: string): Promise<any>{return null;}
```

### REQUEST BODY
An object can be specified for use as an HTTP request body with the @Body annotation.
```javascript
@POST("users/new")
public async createUser(@Body user:User);
```
The objects` method will be discarded

### FORM ENCODED AND MULTIPART
Methods can also be declared to send form-encoded and multipart data.

Form-encoded data is sent when @FormUrlEncoded is present on the method. Each key-value pair is annotated with @Field containing the name and the object providing the value.
```javascript
@POST("user/edit")
@FormUrlEncoded
public async updateUser(@Field("first_name")first: string, @Field("last_name") last: string): Promise<User>{return null;}
```

Multipart requests are used when @Multipart is present on the method. Parts are declared using the @Part annotation.
```javascript
@POST("user/photo")
@Multipart
public async updateUser(@Part("photo")photo: ReadStream, @Part("description")description: string): Promise<User>{return null;}
```

### HEADER MANIPULATION
A request Header can be updated dynamically using the @Header annotation. A corresponding parameter must be provided to the @Header. If the value is null, the header will be omitted.
```javascript
@GET("user")
public async getUser(@Header("Authorization")authorization: string): Promise<User> {return null;}
```
An evaluator can be specified with @Header as well as other parameter annotations, when evaluator is given the parameter will be applied to the evaluator
```javascript
@GET("user")
public async getUser(@Header("Authorization", (x)=>`auth_header_${x}_spetial`)authorization: string): Promise<User> {return null;}
```
The header would be `{"Authorization": "auth_header_123_spetial"}`
