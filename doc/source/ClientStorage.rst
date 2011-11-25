





..
    Classes and methods

Class ClientStorage
================================================================================

..
   class-title


Client storage implementation








    


Constructor
-----------

.. js:class:: ClientStorage()









Methods
-------

..
   class-methods


addListener
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ClientStorage#addListener(callback)


    
    :param  callback: 
         
    














    



get
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ClientStorage#get(key, [isTransient])


    
    :param String key: 
         
    
    :param Boolean isTransient: 
        whether to use persistent storage or transient storage (defaults to false) 
    


    
    :throws Error:
        : if client storage is not supported
    


    
    :returns String|Boolean:
        the value of key or null on failure 
    


Retrieves the value of key from storage









    



remove
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ClientStorage#remove(key, [isTransient])


    
    :param String key: 
         
    
    :param Boolean isTransient: 
        whether to use persistent storage or transient storage (defaults to false) 
    


    
    :throws Error:
        : if client storage is not supported
    



Remove the key from storage









    



removeListener
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ClientStorage#removeListener(callback)


    
    :param  callback: 
         
    














    



set
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ClientStorage#set(key, value, [isTransient])


    
    :param String key: 
         
    
    :param Object value: 
         
    
    :param Boolean isTransient: 
        whether to use persistent storage or transient storage (defaults to false) 
    


    
    :throws Error:
        : if client storage is not supported
    



Set the value of key (add it if key doesn't exist) into storage









    




    



